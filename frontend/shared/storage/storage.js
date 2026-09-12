export const Storage = {
  KEY: 'hunar_state_v1',
  load: function () {
    try {
      const s = localStorage.getItem(this.KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  },
  save: function (state) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(state));
    } catch (e) {
      /* in-memory only */
    }
  },
  clear: function () {
    try {
      localStorage.removeItem(this.KEY);
    } catch (e) {
      /* */
    }
  }
};

if (typeof window !== 'undefined') {
  window.Storage = Storage;
}
