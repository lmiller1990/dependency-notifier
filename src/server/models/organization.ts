import { Knex } from "knex";
import {
  Emails,
  Jobs,
  Modules,
  notify_when,
  Organizations,
  schedule,
} from "../../../dbschema.js";
import debugLib from "debug";
import { update } from "cypress/types/lodash/index.js";

const debug = debugLib("server:models:organization");

interface NotificationSettings {
  frequency: schedule;
}

export const Organization = {
  async getOrganizationById(
    db: Knex,
    options: { organizationId: number }
  ): Promise<Organizations> {
    const org = await db("organizations")
      .where({
        id: options.organizationId,
      })
      .first();

    if (!org) {
      debug(`Did not find org for organization_id: %s`, options.organizationId);
      throw new Error(
        `Did not find org for organization_id: ${options.organizationId}`
      );
    }

    return org;
  },

  async updateOrganization(
    db: Knex,
    options: { organizationId: number; props: Partial<Organizations> }
  ): Promise<void> {
    const { id, ...props } = options.props;
    try {
      await db("organizations")
        .where({
          id: options.organizationId,
        })
        .update(props);
    } catch (e) {
      debug(`Could not update organzation with invalid props %o`, options);
    }
  },

  async getJob(db: Knex, options: { organizationId: number }): Promise<Jobs> {
    const job = await db("jobs")
      .where({
        organization_id: options.organizationId,
      })
      .first();

    if (!job) {
      debug(`Did not find job for organization_id: %s`, options.organizationId);
      throw new Error(
        `Did not find job for organization_id: ${options.organizationId}`
      );
    }

    return job;
  },

  async deleteEmail(
    db: Knex,
    options: { organizationId: number; id: number }
  ): Promise<void> {
    debug(
      "deleting email id: %s for organization_id: %s",
      options.id,
      options.organizationId
    );
    return db("emails")
      .where({
        id: options.id,
        organization_id: options.organizationId,
      })
      .delete();
  },

  async addEmail(
    db: Knex,
    options: { organizationId: number; email: string }
  ): Promise<void> {
    debug(
      "inserting email: %s for organization_id: %s",
      options.email,
      options.organizationId
    );
    return db<Emails>("emails").insert({
      organization_id: options.organizationId,
      email: options.email,
    });
  },

  async getEmails(
    db: Knex,
    options: { organizationId: number }
  ): Promise<Emails[]> {
    const emails = await db<Emails>("emails").where(
      "organization_id",
      options.organizationId
    );

    return emails;
  },

  async getNotificationSettings(
    db: Knex,
    options: { organizationId: number }
  ): Promise<NotificationSettings> {
    const job = await this.getJob(db, {
      organizationId: options.organizationId,
    });

    return {
      frequency: job.job_schedule,
    };
  },
};