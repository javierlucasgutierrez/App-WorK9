// Almacén de datos.
// En el móvil: dentro del propio teléfono (IndexedDB), funciona sin internet.
// Dentro del chat de Claude: en la cuenta de Claude del usuario; si no está disponible, en el navegador.
const DB = (() => {
  const NAME = 'impacto-k9';
  const STORES = ['dogs', 'sessions', 'settings'];
  const KEY = { dogs: 'id', sessions: 'id', settings: 'key' };
  let dbp;

  // ----- IndexedDB -----
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

  const local = {
    all: (store) => tx(store, 'readonly', (s) => s.getAll()),
    get: (store, id) => tx(store, 'readonly', (s) => s.get(id)),
    put: (store, value) => tx(store, 'readwrite', (s) => s.put(value)),
    del: (store, id) => tx(store, 'readwrite', (s) => s.delete(id)),
    byDog: (dogId) => tx('sessions', 'readonly', (s) => s.index('dogId').getAll(dogId)),
    async replaceAll(data) {
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

  // ----- Cuenta de Claude -----
  function remote(cdb) {
    const plain = (snap) => JSON.parse(JSON.stringify(snap.data()));
    const clean = (v) => JSON.parse(JSON.stringify(v)); // quita campos vacíos (undefined)
    const ref = (store, id) => cdb.collection(store).doc(String(id));
    async function retry(fn) {
      try { return await fn(); } catch (e) {
        if (e && e.code === 'unavailable') { await new Promise((r) => setTimeout(r, 400 + Math.random() * 600)); return fn(); }
        if (e && e.code === 'quota_exceeded') throw new Error('No queda espacio para guardar más. Borra alguna foto o sesión antigua.');
        throw e;
      }
    }
    const api = {
      all: (store) => retry(async () => (await cdb.collection(store).limit(1000).get()).docs.map(plain)),
      get: (store, id) => retry(async () => { const s = await ref(store, id).get(); return s.exists ? plain(s) : undefined; }),
      put: (store, value) => retry(() => ref(store, value[KEY[store]]).set(clean(value))),
      del: (store, id) => retry(() => ref(store, id).delete()),
      byDog: (dogId) => retry(async () => (await cdb.collection('sessions').where('dogId', '==', dogId).limit(1000).get()).docs.map(plain)),
      async replaceAll(data) {
        for (const s of STORES) {
          for (const item of await api.all(s)) await api.del(s, item[KEY[s]]);
          for (const item of data[s] || []) await api.put(s, item);
        }
      },
    };
    return api;
  }

  let impl = local;
  let readyP;

  return {
    kind: 'local',
    ready() {
      if (!readyP) {
        readyP = (async () => {
          if (!window.IMPACTO_ARTIFACT || !window.claude) return;
          try {
            const cdb = await window.claude.use('db');
            if (cdb) { impl = remote(cdb); this.kind = 'claude'; }
          } catch { /* se queda en el navegador */ }
        })();
      }
      return readyP;
    },
    all: (s) => impl.all(s),
    get: (s, id) => impl.get(s, id),
    put: (s, v) => impl.put(s, v),
    del: (s, id) => impl.del(s, id),
    byDog: (id) => impl.byDog(id),

    async exportAll() {
      const out = { app: 'impacto-k9', version: 1, exportedAt: new Date().toISOString() };
      for (const s of STORES) out[s] = await impl.all(s);
      return out;
    },

    // Sustituye todo por el contenido de una copia de seguridad.
    async importAll(data) {
      if (!data || data.app !== 'impacto-k9') throw new Error('Este archivo no es una copia de Impacto K9.');
      await impl.replaceAll(data);
    },
  };
})();
