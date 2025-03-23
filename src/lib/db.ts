// Interface simples para o IndexedDB do navegador
// Usado para armazenar dados localmente quando o usuário está offline

interface DBSchema {
  savedTasks: {
    id: string;
    title: string;
    response: string;
    subject: string;
    date: Date;
  };
}

class LocalDB {
  private dbName = 'edupaisDB';
  private dbVersion = 1;

  /**
   * Inicializa o banco de dados local
   */
  async init() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Cria os object stores se não existirem
        if (!db.objectStoreNames.contains('savedTasks')) {
          db.createObjectStore('savedTasks', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        console.error('Erro ao abrir o banco de dados:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Adiciona um item ao banco de dados
   */
  async addItem<K extends keyof DBSchema>(
    storeName: K,
    item: DBSchema[K]
  ): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtém todos os itens de um store
   */
  async getAllItems<K extends keyof DBSchema>(
    storeName: K
  ): Promise<DBSchema[K][]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new LocalDB(); 