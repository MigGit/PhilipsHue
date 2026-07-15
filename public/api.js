// api.js
// Funciones comunes de consumo del bridge Hue

export async function apiGet(path) {
    const response = await fetch(path, {
        headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
        throw new Error(`Error en GET ${path}: ${response.status}`);
    }
    return response.json();
}

export async function apiPost(path, body) {
    const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        throw new Error(`Error en POST ${path}: ${response.status}`);
    }
    return response.json();
}

export async function apiPut(path, body) {
    const response = await fetch(path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        throw new Error(`Error en PUT ${path}: ${response.status}`);
    }
    return response.json();
}

export async function apiDelete(path) {
    const response = await fetch(path, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
        throw new Error(`Error en DELETE ${path}: ${response.status}`);
    }
    return response.json();
}

export function safeParseJson(value) {
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
}
