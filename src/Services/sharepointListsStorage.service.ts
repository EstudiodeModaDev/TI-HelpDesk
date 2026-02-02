import type { ListSizeEstimate } from "../Models/Files";

type GraphClient = {
    get: (path: string, init?: RequestInit) => Promise<any>;
};

function utf8Bytes(str: string): number {
    return new TextEncoder().encode(str).length;
}

function percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
    return sorted[idx];
}

function toRelativePath(nextLink: string): string {
    const u = new URL(nextLink);
    return u.pathname + u.search;
}

function normalizeGraphPath(path: string): string {
    return path.startsWith("/v1.0/") ? path.replace("/v1.0", "") : path;
}

export class SharePointListsStorageService {
    private graph: GraphClient;

    constructor(graph: GraphClient) {
        this.graph = graph;
    }

    async getSiteByPath(hostname: string, sitePath: string) {
        return this.graph.get(`/sites/${hostname}:${sitePath}`);
    }

    async listLists(siteId: string) {
        const res = await this.graph.get(`/sites/${siteId}/lists?$top=200&$select=id,displayName,webUrl,list`);
        return (res?.value ?? []) as Array<{
        id: string;
        displayName: string;
        webUrl?: string;
        list?: { template?: string };
        }>;
    }
  
    async getListItemsCount(siteId: string, listId: string): Promise<number> {
        return this.countItemsByPaging(siteId, listId);
    }

    async estimateAvgRecordBytes(siteId: string, listId: string, sampleSize = 200, pickFields?: string[]): Promise<{ sampleCount: number; avg: number; p95: number }> {
        const top = Math.min(Math.max(sampleSize, 20), 500); // 20..500
        const res = await this.graph.get(`/sites/${siteId}/lists/${listId}/items?$top=${top}&$expand=fields($select=*)`);

        const items = (res?.value ?? []) as any[];

        const sizes: number[] = [];
            for (const it of items) {
                const f = it?.fields ?? {};
                const payload = Array.isArray(pickFields) && pickFields.length > 0 ? Object.fromEntries(pickFields.map((k) => [k, f?.[k]])) : f;
                const bytes = utf8Bytes(JSON.stringify(payload));
                sizes.push(bytes);
            }

            sizes.sort((a, b) => a - b);

            const sampleCount = sizes.length;
            const avg = sampleCount ? Math.round(sizes.reduce((a, b) => a + b, 0) / sampleCount) : 0;
            const p95 = Math.round(percentile(sizes, 0.95));

            return { sampleCount, avg, p95 };
        }

    async estimateListsUsage(hostname: string, sitePath: string, sampleSize = 200, pickFieldsByListName?: Record<string, string[]> ): Promise<ListSizeEstimate[]> {
        const site = await this.getSiteByPath(hostname, sitePath);
        const siteId = site?.id as string;
        if (!siteId) throw new Error("No se pudo resolver siteId");

        const lists = await this.listLists(siteId);

        const out: ListSizeEstimate[] = [];

        for (const l of lists) {
            const name = l.displayName;
            const template = l?.list?.template;
            if (template === "documentLibrary") continue;

            const itemsCount = await this.getListItemsCount(siteId, l.id);

            const pick = pickFieldsByListName?.[name];
            const { sampleCount, avg, p95 } = await this.estimateAvgRecordBytes(siteId, l.id, sampleSize, pick);

            out.push({
                listId: l.id,
                name,
                webUrl: l.webUrl,
                itemsCount,
                sampleCount,
                avgFieldsBytes: avg,
                p95FieldsBytes: p95,
                estimatedFieldsTotalBytes: avg * itemsCount,
                lastCalculatedAt: new Date().toISOString(),
            });
        }

        return out.sort((a, b) => b.estimatedFieldsTotalBytes - a.estimatedFieldsTotalBytes);
    }

    async countItemsByPaging(siteId: string, listId: string): Promise<number> {
        let count = 0;

        let path = `/sites/${siteId}/lists/${listId}/items?$top=200&$select=id`;

        while (path) {
            const res = await this.graph.get(normalizeGraphPath(path));
            const items = (res?.value ?? []) as any[];
            count += items.length;

            const next = res?.["@odata.nextLink"];
            path = next ? normalizeGraphPath(toRelativePath(next)) : "";
        }

        return count;
    }

}