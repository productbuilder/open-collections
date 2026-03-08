// Runtime schema helpers for TimeMap Collector MVP.

const REQUIRED_COLLECTION_FIELDS = ['id', 'title', 'description', 'items'];
const REQUIRED_ITEM_FIELDS = ['id', 'title', 'media', 'license'];

export { REQUIRED_COLLECTION_FIELDS, REQUIRED_ITEM_FIELDS };

export function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateCollectionShape(collection) {
  const errors = [];

  if (!isObject(collection)) {
    errors.push('Collection must be an object.');
    return errors;
  }

  for (const field of REQUIRED_COLLECTION_FIELDS) {
    if (!(field in collection)) {
      errors.push(`Missing collection field: ${field}`);
    }
  }

  if (!Array.isArray(collection.items)) {
    errors.push('Collection.items must be an array.');
    return errors;
  }

  collection.items.forEach((item, index) => {
    if (!isObject(item)) {
      errors.push(`Item at index ${index} must be an object.`);
      return;
    }

    for (const field of REQUIRED_ITEM_FIELDS) {
      if (!(field in item)) {
        errors.push(`Item ${index} missing field: ${field}`);
      }
    }

    if (item.media && !isObject(item.media)) {
      errors.push(`Item ${index} field media must be an object.`);
    }

    if (item.tags && !Array.isArray(item.tags)) {
      errors.push(`Item ${index} field tags must be an array.`);
    }
  });

  return errors;
}

export function createManifest(collection, items) {
  return {
    id: collection.id,
    title: collection.title,
    description: collection.description,
    items,
  };
}
