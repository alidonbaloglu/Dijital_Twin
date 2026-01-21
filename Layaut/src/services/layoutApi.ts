/// <reference types="vite/client" />
/**
 * Layout API Service - Backend Layout API ile iletişim
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================
// TYPES
// ============================================

export interface ConnectionPoint {
    id: string;
    x: number;
    y: number;
    direction: 'left' | 'right' | 'top' | 'bottom';
}

export interface ComponentTemplate {
    id: string;
    name: string;
    type: string;
    category: string;
    svgContent: string;
    width: number;
    height: number;
    connectionPoints: ConnectionPoint[];
    metadata: Record<string, any>;
    thumbnail?: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LayoutComponent {
    id: string;
    productionLineId: string;
    templateId: string;
    instanceName: string;
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    zIndex: number;
    isLocked: boolean;
    customData: Record<string, any>;
    template?: ComponentTemplate;
    createdAt: string;
    updatedAt: string;
}

export interface LayoutConnection {
    id: string;
    productionLineId: string;
    fromComponentId: string;
    toComponentId: string;
    fromPointId: string;
    toPointId: string;
    connectionType: string;
    pathStyle: string;
    customPath?: string;
    color: string;
    animated: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProductionLine {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    viewBox: string;
    gridSize: number;
    backgroundColor: string;
    components: LayoutComponent[];
    connections: LayoutConnection[];
    createdAt: string;
    updatedAt: string;
}

// ============================================
// API HELPERS
// ============================================

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(response.status, errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// ============================================
// PRODUCTION LINES API
// ============================================

export async function getLayouts(): Promise<ProductionLine[]> {
    return fetchApi<ProductionLine[]>(`/api/layouts?_t=${Date.now()}`);
}

export async function getLayoutById(id: string): Promise<ProductionLine> {
    return fetchApi<ProductionLine>(`/api/layouts/${id}?_t=${Date.now()}`);
}

export async function createLayout(data: {
    name: string;
    description?: string;
    viewBox?: string;
    gridSize?: number;
    backgroundColor?: string;
}): Promise<ProductionLine> {
    return fetchApi<ProductionLine>('/api/layouts', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateLayout(id: string, data: Partial<ProductionLine>): Promise<ProductionLine> {
    return fetchApi<ProductionLine>(`/api/layouts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteLayout(id: string): Promise<void> {
    await fetchApi(`/api/layouts/${id}`, { method: 'DELETE' });
}

// ============================================
// LAYOUT COMPONENTS API
// ============================================

export async function addLayoutComponent(
    layoutId: string,
    data: {
        templateId: string;
        instanceName: string;
        x: number;
        y: number;
        rotation?: number;
        scaleX?: number;
        scaleY?: number;
        zIndex?: number;
        customData?: Record<string, any>;
    }
): Promise<LayoutComponent> {
    return fetchApi<LayoutComponent>(`/api/layouts/${layoutId}/components`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateLayoutComponent(
    layoutId: string,
    componentId: string,
    data: Partial<LayoutComponent>
): Promise<LayoutComponent> {
    return fetchApi<LayoutComponent>(`/api/layouts/${layoutId}/components/${componentId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteLayoutComponent(layoutId: string, componentId: string): Promise<void> {
    await fetchApi(`/api/layouts/${layoutId}/components/${componentId}`, { method: 'DELETE' });
}

// ============================================
// LAYOUT CONNECTIONS API
// ============================================

export async function addLayoutConnection(
    layoutId: string,
    data: {
        fromComponentId: string;
        toComponentId: string;
        fromPointId: string;
        toPointId: string;
        connectionType?: string;
        pathStyle?: string;
        color?: string;
        animated?: boolean;
    }
): Promise<LayoutConnection> {
    return fetchApi<LayoutConnection>(`/api/layouts/${layoutId}/connections`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function deleteLayoutConnection(layoutId: string, connectionId: string): Promise<void> {
    await fetchApi(`/api/layouts/${layoutId}/connections/${connectionId}`, { method: 'DELETE' });
}

// ============================================
// COMPONENT TEMPLATES API
// ============================================

export async function getComponentTemplates(params?: {
    type?: string;
    category?: string;
}): Promise<ComponentTemplate[]> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.set('type', params.type);
    if (params?.category) queryParams.set('category', params.category);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/api/components/templates?${queryString}` : '/api/components/templates';

    return fetchApi<ComponentTemplate[]>(endpoint);
}

export async function getComponentTemplateById(id: string): Promise<ComponentTemplate> {
    return fetchApi<ComponentTemplate>(`/api/components/templates/${id}`);
}

export async function createComponentTemplate(data: {
    name: string;
    type: string;
    category?: string;
    svgContent: string;
    width?: number;
    height?: number;
    connectionPoints?: ConnectionPoint[];
    metadata?: Record<string, any>;
}): Promise<ComponentTemplate> {
    return fetchApi<ComponentTemplate>('/api/components/templates', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateComponentTemplate(
    id: string,
    data: Partial<ComponentTemplate>
): Promise<ComponentTemplate> {
    return fetchApi<ComponentTemplate>(`/api/components/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteComponentTemplate(id: string): Promise<void> {
    await fetchApi(`/api/components/templates/${id}`, { method: 'DELETE' });
}

// ============================================
// COMPONENT TYPES/CATEGORIES API
// ============================================

export async function getComponentTypes(): Promise<{ type: string; count: number }[]> {
    return fetchApi('/api/components/types');
}

export async function getComponentCategories(): Promise<{ category: string; count: number }[]> {
    return fetchApi('/api/components/categories');
}
