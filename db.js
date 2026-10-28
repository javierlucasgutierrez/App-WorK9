// Almacén dentro del móvil (IndexedDB). Todo funciona sin internet.
const DB = (() => {
  const NAME = 'impacto-k9';
  const STORES = ['dogs', 'sessions', 'settings'];
  let dbp;

  function open() {
    if (!dbp) {
      dbp = new Promise((resolve, reject) => {
        const req = indexedDB.open(NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('dogs')) db.createObjectStore('dogs', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('sessions')) {
            const s = db.createObjectStore('sessions', { keyPath: 'id' });
            s.createIndex('dogId', 'dogId');
          }
          if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbp;
  }

  async function tx(store, mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const result = fn(t.objectStore(store));
      t.oncomplete = () => resolve(result && 'result' in result ? result.result : result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  return {
    all: (store) => tx(store, 'readonly', (s) => s.getAll()),
    get: (store, id) => tx(store, 'readonly', (s) => s.get(id)),
    put: (store, value) => tx(store, 'readwrite', (s) => s.put(value)),
    del: (store, id) => tx(store, 'readwrite', (s) => s.delete(id)),
    byDog: (dogId) => tx('sessions', 'readonly', (s) => s.index('dogId').getAll(dogId)),

    async exportAll() {
      const out = { app: 'impacto-k9', version: 1, exportedAt: new Date().toISOString() };
      for (const s of STORES) out[s] = await this.all(s);
      return out;
    },

    // Sustituye todo por el contenido de una copia de seguridad.
    async importAll(data) {
      if (!data || data.app !== 'impacto-k9') throw new Error('Este archivo no es una copia de Impacto K9.');
      const db = await open();
      await new Promise((resolve, reject) => {
        const t = db.transaction(STORES, 'readwrite');
        for (const s of STORES) {
          const st = t.objectStore(s);
          st.clear();
          for (const item of data[s] || []) st.put(item);
        }
        t.oncomplete = resolve;
        t.onerror = () => reject(t.error);
      });
    },
  };
})();
