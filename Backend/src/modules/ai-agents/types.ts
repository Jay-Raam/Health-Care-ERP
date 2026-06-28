export enum AgentType {
  PLANNER = 'PLANNER',
  APPOINTMENT = 'APPOINTMENT',
  DOCTOR_ASSISTANT = 'DOCTOR_ASSISTANT',
  LAB_REPORT = 'LAB_REPORT',
  BILLING = 'BILLING',
  EMAIL = 'EMAIL',
  NOTIFICATION = 'NOTIFICATION',
  AUDIT = 'AUDIT'
}

export interface AgentRequest {
  query: string;
  patientId: string;
  context?: Record<string, any>;
}

export interface AgentResponse {
  success: boolean;
  agentUsed: AgentType;
  response: string;
  data?: any;
}
