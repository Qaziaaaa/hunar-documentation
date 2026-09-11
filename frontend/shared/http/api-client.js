export const Api = {
  base: null,
  baseCandidates: [
    function () { return (typeof location !== 'undefined' && location.origin) ? location.origin + '/api' : null; },
    function () { return 'http://localhost:3000/api'; }
  ],
  resolveBase: function () {
    if (this.base) return Promise.resolve(this.base);
    const candidates = this.baseCandidates.filter(Boolean);
    return fetch(candidates[0]() + '/health', { method: 'GET' })
      .then(function (r) {
        if (!r.ok) throw new Error('bad');
        return r.json();
      })
      .then(function () {
        Api.base = candidates[0]();
        return Api.base;
      })
      .catch(function () {
        Api.base = candidates[1]();
        return Api.base;
      });
  },
  get: function (endpoint) {
    return this.resolveBase()
      .then(function (base) { return fetch(base + endpoint); })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .catch(function () { return null; });
  },
  getJobs: function () {
    return this.resolveBase()
      .then(function (base) { return fetch(base + '/jobs'); })
      .then(function (r) {
        if (!r.ok) throw new Error('bad status');
        return r.json();
      })
      .then(function (d) { return d && d.jobs ? d.jobs : []; })
      .catch(function () { return null; });
  },
  putJobs: function (list) {
    return this.resolveBase()
      .then(function (base) {
        return fetch(base + '/jobs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(list)
        });
      })
      .catch(function () { return null; });
  }
};

if (typeof window !== 'undefined') {
  window.Api = Api;
}
