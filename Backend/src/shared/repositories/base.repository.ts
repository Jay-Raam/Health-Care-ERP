import { Model, Document, FilterQuery, UpdateQuery, QueryOptions, ClientSession } from 'mongoose';
import { logContext } from '../logs/logger.js';

export interface BaseAuditFields {
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date | null;
  deletedBy?: string;
}

export abstract class BaseRepository<T extends Document & BaseAuditFields> {
  protected constructor(protected readonly model: Model<T>) {}

  private getCurrentUserId(): string | undefined {
    const store = logContext.getStore();
    return store?.userId;
  }

  async create(data: Partial<T>, session?: ClientSession): Promise<T> {
    const userId = this.getCurrentUserId();
    const auditData = {
      ...data,
      createdBy: userId || data.createdBy,
      updatedBy: userId || data.updatedBy
    };
    
    const docs = await this.model.create([auditData], { session });
    return docs[0] as any;
  }

  async findById(id: string, options: QueryOptions = {}): Promise<T | null> {
    return this.model.findOne({ _id: id, deletedAt: null } as FilterQuery<T>, null, { lean: true, ...options }) as any;
  }

  async findOne(filter: FilterQuery<T>, options: QueryOptions = {}): Promise<T | null> {
    const queryFilter = { ...filter, deletedAt: null } as FilterQuery<T>;
    return this.model.findOne(queryFilter, null, { lean: true, ...options }) as any;
  }

  async find(filter: FilterQuery<T> = {}, options: QueryOptions = {}): Promise<T[]> {
    const queryFilter = { ...filter, deletedAt: null } as FilterQuery<T>;
    return this.model.find(queryFilter, null, { lean: true, ...options }) as any;
  }

  async update(id: string, updateData: UpdateQuery<T>, options: QueryOptions = {}, session?: ClientSession): Promise<T | null> {
    const userId = this.getCurrentUserId();
    
    // Inject updateBy
    const formattedUpdate = {
      ...updateData,
      $set: {
        ...(updateData.$set || {}),
        updatedBy: userId
      }
    } as UpdateQuery<T>;

    const queryFilter = { _id: id, deletedAt: null } as FilterQuery<T>;
    return this.model.findOneAndUpdate(queryFilter, formattedUpdate, {
      new: true,
      lean: true,
      session,
      ...options
    }) as any;
  }

  async softDelete(id: string, session?: ClientSession): Promise<T | null> {
    const userId = this.getCurrentUserId();
    const updateData = {
      $set: {
        deletedAt: new Date(),
        deletedBy: userId
      }
    } as UpdateQuery<T>;

    const queryFilter = { _id: id, deletedAt: null } as FilterQuery<T>;
    return this.model.findOneAndUpdate(queryFilter, updateData, {
      new: true,
      lean: true,
      session
    }) as any;
  }

  async restore(id: string, session?: ClientSession): Promise<T | null> {
    const updateData = {
      $set: {
        deletedAt: null,
        deletedBy: undefined
      }
    } as UpdateQuery<T>;

    // We can query soft deleted item to restore it
    const queryFilter = { _id: id, deletedAt: { $ne: null } } as FilterQuery<T>;
    return this.model.findOneAndUpdate(queryFilter, updateData, {
      new: true,
      lean: true,
      session
    }) as any;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    const queryFilter = { ...filter, deletedAt: null } as FilterQuery<T>;
    return this.model.countDocuments(queryFilter);
  }

  async executeInTransaction<R>(fn: (session: ClientSession) => Promise<R>): Promise<R> {
    const session = await this.model.db.startSession();
    session.startTransaction();
    try {
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
