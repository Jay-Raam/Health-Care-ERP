import { AgentType, AgentRequest, AgentResponse } from './types.js';
import { eventEmitter, HospitalEvents } from '../../shared/events/eventEmitter.js';
import { logger } from '../../shared/logs/logger.js';
import { appointmentService } from '../appointments/service.js';
import { labReportService } from '../labs/service.js';
import { billService } from '../billing/service.js';
import { completeWithFallback } from '../../shared/providers/openrouter.provider.js';

// Base interface for independent agents
export interface IAgent {
  type: AgentType;
  execute(request: AgentRequest): Promise<AgentResponse>;
}

// 1. Appointment Agent
export class AppointmentAgent implements IAgent {
  type = AgentType.APPOINTMENT;
  async execute(request: AgentRequest): Promise<AgentResponse> {
    logger.info('AppointmentAgent executing task...');
    const list = await appointmentService.getPatientAppointments(request.patientId);
    
    return {
      success: true,
      agentUsed: this.type,
      response: `You have ${list.length} appointments scheduled. Your next appointment status is: ${list[0]?.status || 'None'}.`,
      data: list
    };
  }
}

// 2. Lab Report Agent
export class LabReportAgent implements IAgent {
  type = AgentType.LAB_REPORT;
  async execute(request: AgentRequest): Promise<AgentResponse> {
    logger.info('LabReportAgent executing task...');
    const reports = await labReportService.getPatientReports(request.patientId);
    const anomalies = reports
      .filter((r) => r.ocrResult?.flaggedAnomalies?.length > 0)
      .flatMap((r) => r.ocrResult?.flaggedAnomalies);

    return {
      success: true,
      agentUsed: this.type,
      response: `Analysis complete. Checked ${reports.length} report(s). Flagged issues: ${
        anomalies.length > 0 ? anomalies.join(', ') : 'None'
      }.`,
      data: reports
    };
  }
}

// 3. Billing Agent
export class BillingAgent implements IAgent {
  type = AgentType.BILLING;
  async execute(request: AgentRequest): Promise<AgentResponse> {
    logger.info('BillingAgent executing task...');
    const bills = await billService.listPatientBills(request.patientId);
    const unpaid = bills.filter((b) => b.status === 'PENDING');
    const totalDue = unpaid.reduce((sum, b) => sum + b.totalAmount, 0);

    return {
      success: true,
      agentUsed: this.type,
      response: `You have ${unpaid.length} unpaid invoices. Total outstanding balance is $${totalDue.toFixed(2)}.`,
      data: bills
    };
  }
}

// 4. Doctor Assistant Agent (Queries OpenRouter with prioritized failovers)
export class DoctorAssistantAgent implements IAgent {
  type = AgentType.DOCTOR_ASSISTANT;
  async execute(request: AgentRequest): Promise<AgentResponse> {
    logger.info('DoctorAssistantAgent executing task via OpenRouter...');

    const systemPrompt = `You are a helpful AI Doctor's Assistant. You only answer medical and clinical questions. If the user asks a non-medical question (e.g. general knowledge, math, programming), reject it politely stating you are a clinical assistant. Keep answers concise, factual, and helpful.`;

    const responseText = await completeWithFallback({
      prompt: request.query,
      systemPrompt,
      temperature: 0.3
    });

    return {
      success: true,
      agentUsed: this.type,
      response: responseText
    };
  }
}

// 5. Audit Agent (logs transaction metrics)
export class AuditAgent implements IAgent {
  type = AgentType.AUDIT;
  async execute(request: AgentRequest): Promise<AgentResponse> {
    logger.info({ request }, 'AuditAgent logged execution footprint');
    return {
      success: true,
      agentUsed: this.type,
      response: 'Audit log written successfully'
    };
  }
}

// 6. Planner Agent (decides and orchestrates execution)
export class PlannerAgent implements IAgent {
  type = AgentType.PLANNER;
  private agents: Map<AgentType, IAgent> = new Map();

  constructor() {
    this.agents.set(AgentType.APPOINTMENT, new AppointmentAgent());
    this.agents.set(AgentType.LAB_REPORT, new LabReportAgent());
    this.agents.set(AgentType.BILLING, new BillingAgent());
    this.agents.set(AgentType.DOCTOR_ASSISTANT, new DoctorAssistantAgent());
    this.agents.set(AgentType.AUDIT, new AuditAgent());
  }

  async execute(request: AgentRequest): Promise<AgentResponse> {
    logger.info({ query: request.query }, 'PlannerAgent determining route...');
    
    let targetType = AgentType.DOCTOR_ASSISTANT;
    let classification = '';

    // Try LLM Semantic Intent Classification (ChatGPT-style routing)
    try {
      const classificationPrompt = `Classify this user query: "${request.query}"
Intents:
- APPOINTMENT: queries about scheduling, booking, visits, checkups, consultation slots.
- LAB_REPORT: queries about scans, tests, blood values, lab results, ocr reports.
- BILLING: queries about payments, invoices, bills, fees, financial accounts.
- DOCTOR_ASSISTANT: general medical questions, symptom explanations, diet/health advice.
- INVALID: non-medical chit-chat, math, programming, general query.

Respond with exactly one word from the list above. Do not include punctuation or extra text.`;

      const response = await completeWithFallback({
        prompt: classificationPrompt,
        systemPrompt: 'You are an AI Clinical Router. Respond with exactly one uppercase word.',
        temperature: 0.0
      });

      classification = response.trim().toUpperCase();
      logger.info(`PlannerAgent semantic LLM classification resolved: ${classification}`);
    } catch (err: any) {
      logger.warn(`Semantic LLM classification failed: ${err.message}. Falling back to regex parser.`);
    }

    const isInvalid = classification === 'INVALID';
    const isAppointmentLLM = classification === 'APPOINTMENT';
    const isLabReportLLM = classification === 'LAB_REPORT';
    const isBillingLLM = classification === 'BILLING';
    const isDoctorAssistantLLM = classification === 'DOCTOR_ASSISTANT';

    // Regex Check (as active failover backup)
    const queryLower = request.query.toLowerCase();
    const isAppointmentRegex = /appointment|schedule|book|visit|checkup|consultation|slots|reserve/i.test(queryLower);
    const isLabReportRegex = /lab|report|test|blood|scan|urine|diagnostic|hematology|scans|results/i.test(queryLower);
    const isBillingRegex = /billing|invoice|pay|fee|cost|charge|receipt|bill|settle|due/i.test(queryLower);
    const isGeneralMedicalRegex = /feel|pain|symptom|health|disease|medical|doctor|dose|diet|sugar|cholesterol|recommendation|advice|help|gpt|chatgpt|chat|ai|ask|assistant/i.test(queryLower);

    const isAppointment = classification ? isAppointmentLLM : isAppointmentRegex;
    const isLabReport = classification ? isLabReportLLM : isLabReportRegex;
    const isBilling = classification ? isBillingLLM : isBillingRegex;
    const isGeneralMedical = classification ? (isDoctorAssistantLLM || isAppointmentLLM || isLabReportLLM || isBillingLLM) : isGeneralMedicalRegex;

    if (isInvalid || (!classification && !isAppointment && !isLabReport && !isBilling && !isGeneralMedical)) {
      // Intercept non-clinical / non-medical questions at the Fallback Boundary
      return {
        success: false,
        agentUsed: this.type,
        response: "I am an AI Hospital Assistant. I can only assist with clinical inquiries, patient charts, lab scans, billing, or scheduling."
      };
    }

    if (isAppointment) {
      targetType = AgentType.APPOINTMENT;
    } else if (isLabReport) {
      targetType = AgentType.LAB_REPORT;
    } else if (isBilling) {
      targetType = AgentType.BILLING;
    } else {
      targetType = AgentType.DOCTOR_ASSISTANT;
    }

    const targetAgent = this.agents.get(targetType);
    if (!targetAgent) {
      throw new Error(`Target agent ${targetType} not found`);
    }

    logger.info(`PlannerAgent routed query to ${targetType}`);
    const response = await targetAgent.execute(request);

    // Enterprise Clinical safety guardrails
    if (response.response) {
      const hasClinicalDosage = /\b(mg|ml|mcg|tablet|dosage|pill|g\/dL|ng\/mL|sulfate)\b/i.test(response.response);
      const containsDisclaimer = /disclaimer|physician|licensed|professional/i.test(response.response);
      
      if (hasClinicalDosage && !containsDisclaimer) {
        response.response = `${response.response}\n\n> [!CAUTION]\n> **AI Clinical Guardrail Notice**: The above suggestions contain chemical dosage or diagnostics indicators. All values must be reviewed and signed off by a licensed physician before clinical application.`;
      }
    }

    // Asynchronously log audit footprint
    const auditAgent = this.agents.get(AgentType.AUDIT) as AuditAgent;
    auditAgent.execute(request).catch((err) => logger.warn('Audit agent logging failed: ' + err.message));

    // Emit event system-wide
    eventEmitter.emit(HospitalEvents.AI_COMPLETED, {
      query: request.query,
      patientId: request.patientId,
      agentUsed: targetType,
      response: response.response
    });

    return response;
  }
}

export const plannerAgent = new PlannerAgent();
export default plannerAgent;
