import { extractSearchFields } from "../utils/fields";
import { tokenizeEn } from "../language/english";
import { tokenizeAr } from "../language/arabic";

export async function indexDocument(
  doc: any,
  collectionName: string,
  mongo: any,
  language: "en" | "ar" = "en"
) {
  const fields = extractSearchFields(doc);
  const ops: any[] = [];

  for (const { field, value } of fields) {
    const tokens =
      language === "ar"
        ? tokenizeAr(value as string)
        : tokenizeEn(value as string);

    const termMap: Record<string, { tf: number; positions: number[] }> = {};

    tokens.forEach((term, pos) => {
      if (!termMap[term]) {
        termMap[term] = { tf: 0, positions: [] };
      }
      termMap[term].tf++;
      termMap[term].positions.push(pos);
    });

    for (const term in termMap) {
      ops.push({
        updateOne: {
          filter: {
            term,
            docId: doc._id,
            field,
            collection: collectionName
          },
          update: {
            $set: {
              term,
              docId: doc._id,
              field,
              collection: collectionName,
              tf: termMap[term].tf,
              positions: termMap[term].positions
            }
          },
          upsert: true
        }
      });
    }
  }

  if (ops.length > 0) {
    await mongo.bulkWrite(ops);
  }
}
