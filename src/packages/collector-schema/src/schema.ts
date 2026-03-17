export interface MediaRef {
  type?: string;
  url: string;
  thumbnailUrl?: string;
}

export interface CollectorItem {
  id: string;
  title: string;
  media: MediaRef;
  license: string;
  description?: string;
  creator?: string;
  date?: string;
  location?: string;
  source?: string;
  attribution?: string;
  tags?: string[];
  include?: boolean;
}

export interface CollectorCollection {
  id: string;
  title: string;
  description: string;
  items: CollectorItem[];
}

export interface ProviderCapabilities {
  canListAssets: boolean;
  canGetAsset: boolean;
  canSaveMetadata: boolean;
  canExportCollection: boolean;
  canRead?: boolean;
  canWrite?: boolean;
  canPublish?: boolean;
  canStoreAssets?: boolean;
  canStoreManifest?: boolean;
  requiresCredentials?: boolean;
  supportsReconnect?: boolean;
  supportsPull?: boolean;
  supportsPush?: boolean;
}

export interface ProviderConnectionResult {
  ok: boolean;
  message: string;
  capabilities: ProviderCapabilities;
}

export interface Provider {
  id: string;
  label: string;
  connect(config?: Record<string, string>): Promise<ProviderConnectionResult>;
  listAssets(): Promise<CollectorItem[]>;
  getAsset(id: string): Promise<CollectorItem | null>;
  saveMetadata(id: string, patch: Partial<CollectorItem>): Promise<CollectorItem | null>;
  exportCollection(collectionMeta: Pick<CollectorCollection, 'id' | 'title' | 'description'>): Promise<CollectorCollection>;
  getCapabilities(): ProviderCapabilities;
}
