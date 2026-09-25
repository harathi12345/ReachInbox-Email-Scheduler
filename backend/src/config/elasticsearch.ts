import { Client } from "@elastic/elasticsearch";

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || "http://localhost:9200";
export const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX || "reachinbox-emails";

export const esClient = new Client({
  node: ELASTICSEARCH_URL,
});

export const initElasticsearch = async () => {
  try {
    const indexExists = await esClient.indices.exists({ index: ELASTICSEARCH_INDEX });
    if (!indexExists) {
      await esClient.indices.create({
        index: ELASTICSEARCH_INDEX,
        mappings: {
          properties: {
            id: { type: "keyword" },
            recipient: { type: "keyword" },
            sender: { type: "keyword" },
            subject: { type: "text" },
            body: { type: "text" },
            status: { type: "keyword" },
            scheduledAt: { type: "date" },
            sentAt: { type: "date" },
            createdAt: { type: "date" },
            updatedAt: { type: "date" }
          }
        }
      });
      console.log(`[Elasticsearch] Created index: ${ELASTICSEARCH_INDEX}`);
    } else {
      console.log(`[Elasticsearch] Index ${ELASTICSEARCH_INDEX} already exists.`);
    }
  } catch (error: any) {
    console.warn(`[Elasticsearch] Initialization warning: ${error.message}. Search features may be unavailable.`);
  }
};

export const indexEmailDocument = async (email: any) => {
  try {
    await esClient.index({
      index: ELASTICSEARCH_INDEX,
      id: email.id,
      document: {
        id: email.id,
        recipient: email.to,
        sender: email.sender || null,
        subject: email.subject,
        body: email.body,
        status: email.status,
        scheduledAt: email.scheduledAt || null,
        sentAt: email.messageId ? new Date() : null, // approximations if sentAt doesn't exist explicitly in Prisma
        createdAt: email.createdAt,
        updatedAt: email.updatedAt
      }
    });
  } catch (error: any) {
    console.error(`[Elasticsearch] Failed to index email ${email.id}:`, error.message);
  }
};

export const updateEmailDocumentStatus = async (id: string, updates: Record<string, any>) => {
  try {
    const docUpdates: any = {};
    if (updates.status) docUpdates.status = updates.status;
    if (updates.scheduledAt) docUpdates.scheduledAt = updates.scheduledAt;
    if (updates.sentAt) docUpdates.sentAt = updates.sentAt;

    await esClient.update({
      index: ELASTICSEARCH_INDEX,
      id: id,
      doc: docUpdates,
      doc_as_upsert: false
    });
  } catch (error: any) {
    if (error.meta?.statusCode === 404) {
      console.warn(`[Elasticsearch] Update skipped: Document ${id} not found.`);
      return;
    }
    console.error(`[Elasticsearch] Failed to update document ${id}:`, error.message);
  }
};
