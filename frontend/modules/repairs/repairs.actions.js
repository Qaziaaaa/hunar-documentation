import { Store } from '../../app/state.js';
import { UI, esc, fmtRs, wavUri } from '../../shared/ui/ui.js';
import { ic } from '../../shared/icons/icons.js';

let compDraft = null;
let recState = null;

export function compPreviewHtml(a) {
  return '<div class="rec-box"><div class="wave-box">' +
    '<button class="btn btn-soft btn-sm" onclick="A.audioPlay(\'comp-prev\')">' + ic('play', { s: 13 }) + '</button>' +
    '<div style="flex:1"><audio id="comp-prev" src="' + a.uri + '" preload="metadata"></audio><div class="smallnote">Voice summary · ' + a.duration + 's</div></div></div>' +
    '<button class="btn btn-outline btn-sm" onclick="A.comp.rec()">' + ic('refresh', { s: 13 }) + ' Re-record</button>' +
    '<button class="btn btn-danger btn-sm" onclick="A.comp.delAudio()">' + ic('trash', { s: 13 }) + '</button></div>';
}

export const RepairsActions = {
  approveRepairAmount: function (jobId) {
    const res = Store.customerApproveRepair(jobId);
    if (res.error) UI.toast(res.error, 'danger', 'Error');
    if (window.R) window.R();
  },

  approveRepairFinal: function (jobId) {
    const res = Store.customerApproveRepair(jobId);
    if (res.error) UI.toast(res.error, 'danger', 'Error');
    if (window.R) window.R();
  },

  rejectFinalQuote: function (jobId) {
    const j = Store.jobById(jobId);
    if (!j) return;
    UI.confirm({
      icon: 'alert',
      title: 'Reject final quote · end this job?',
      body: 'If you reject this final quote, no repair will be done and this job will be closed. You can always post a new job or choose another professional later.',
      okText: 'Yes, reject & end',
      cancelText: 'Keep job open',
      danger: true,
      onOk: function () {
        const res = Store.customerRejectRepair(jobId);
        if (res.error) { UI.toast(res.error, 'danger', 'Cannot reject'); return; }
        UI.toast('Final quote rejected. The job has been closed.', 'ok', 'Job ended');
        if (window.go) window.go('/customer/jobs/' + jobId);
      }
    });
  },

  openExtraModal: function (jobId) {
    UI.openModal(
      '<div class="modal-h"><h3>' + ic('toolbox', { s: 16 }) + ' Request Additional Work</h3><button data-close="1" class="icon-btn">' + ic('x', { s: 16 }) + '</button></div>' +
      '<div class="modal-b">' +
      '<p style="color:var(--muted);font-size:13.5px;margin-bottom:16px">Found something else to fix? Each extra work gets its own quote and your approval, so it never mixes with the original repair price.</p>' +
      '<div class="field"><label>What needs to be done? (e.g. Fix leaking bathroom tap)</label><input class="input" id="ext-title" placeholder="e.g. Fix leaking bathroom tap" /></div>' +
      '<div class="field"><label>Details (optional)</label><textarea class="textarea" id="ext-note" placeholder="Mention any extra info the professional should know."></textarea></div>' +
      '<button class="btn btn-primary btn-lg btn-block" onclick="A.requestExtra(\'' + jobId + '\')">' + ic('send', { s: 15 }) + ' Send Request</button>' +
      '</div>',
      {
        onMount: function () {
          const el = UI._modalEl;
          const close = el ? el.querySelector('[data-close]') : null;
          if (close) close.addEventListener('click', function () { UI.closeModal(); });
        }
      }
    );
  },

  requestExtra: function (jobId) {
    const title = document.getElementById('ext-title') ? document.getElementById('ext-title').value : '';
    const note = document.getElementById('ext-note') ? document.getElementById('ext-note').value : '';
    if (!title.trim()) { UI.toast('Tell us what work you want done.', 'danger', 'Missing title'); return; }
    const res = Store.requestExtra(jobId, title, note);
    if (res.error) { UI.toast(res.error, 'danger', 'Cannot request'); return; }
    UI.closeModal();
    UI.toast('Additional work requested. The professional will quote it separately.', 'ok', 'Request sent');
    if (window.R) window.R();
  },

  decideExtra: function (jobId, extraId, act) {
    const res = Store.decideExtra(jobId, extraId, act);
    if (res.error) { UI.toast(res.error, 'danger', 'Cannot respond'); return; }
    UI.toast(act === 'approve' ? 'Approved — added to your booking.' : 'Declined.', 'ok', act === 'approve' ? 'Approved' : 'Declined');
    if (window.R) window.R();
  },

  sendExtraQuote: function (jobId, extraId) {
    const inp = document.getElementById('exq-' + extraId);
    if (!inp) return;
    const val = parseInt(inp.value, 10);
    if (!val || val < 50) {
      UI.toast('Enter a valid quote (min Rs. 50).', 'danger', 'Invalid quote');
      inp.classList.add('err');
      setTimeout(function () { inp.classList.remove('err'); }, 2000);
      return;
    }
    const res = Store.quoteExtra(jobId, extraId, val);
    if (res.error) { UI.toast(res.error, 'danger', 'Cannot quote'); return; }
    UI.toast('Quote of ' + fmtRs(val) + ' sent for approval.', 'ok', 'Quote sent');
    if (window.R) window.R();
  },

  startRepair: function (jobId) {
    Store.workerStartRepair(jobId);
    if (window.R) window.R();
  },

  completeRepair: function (jobId) {
    RepairsActions.comp.open(jobId);
  },

  audioPlay: function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.paused) {
      el.play();
    } else {
      el.pause();
    }
  },

  comp: {
    open: function (jobId) {
      compDraft = { jobId: jobId, note: '', images: [], audio: null };
      this.render();
    },
    render: function () {
      if (!compDraft) return;
      const d = compDraft;
      const imgGrid = d.images.length ? '<div class="grid-3" style="margin-top:12px">' + d.images.map(function (im, i) {
        return '<div class="img-thumb"><img src="' + im + '" /><button class="img-del" onclick="A.comp.delImage(' + i + ')">' + ic('trash', { s: 13 }) + '</button></div>';
      }).join('') + '</div>' : '';
      const recRow = recState && recState.active
        ? '<div style="display:flex;align-items:center;gap:10px;margin-top:10px;background:var(--danger-bg);border:1px solid rgba(220,38,38,.25);border-radius:12px;padding:10px 12px"><span style="width:9px;height:9px;border-radius:50%;background:var(--danger);animation:pulse 1.2s infinite;flex:none"></span><b style="font-size:13px">Recording voice note…</b><span id="recTimer" style="font-weight:800;font-family:monospace">0:00</span><button class="btn btn-danger btn-sm" style="margin-left:auto" onclick="A.comp.stopRec()">' + ic('stop', { s: 13 }) + ' Stop</button></div>'
        : '';
      UI.openModal(
        '<div class="modal-h"><h3>' + ic('camera', { s: 16 }) + ' Complete Job · Proof &amp; Summary</h3><button data-close="1" class="icon-btn">' + ic('x', { s: 16 }) + '</button></div>' +
        '<div class="modal-b">' +
        '<p style="color:var(--muted);font-size:13.5px;margin-bottom:16px">Marking the job complete requires proof of the finished work. Add photos of the repair and, if you like, a short voice note the customer can hear.</p>' +
        '<div class="field"><label>What was done?</label><input class="input" id="comp-note" placeholder="e.g. Fixed the compressor — AC is cooling normally now" value="' + esc(d.note) + '" oninput="A.comp.note(this.value)" /></div>' +
        '<div class="field"><label>Proof photos</label>' +
        '<label class="upload-zone" style="display:block"><div style="display:flex;flex-direction:column;align-items:center;gap:6px">' + ic('camera', { s: 26 }) + '<b>Add photos</b><span style="font-size:12.5px">Capture or upload photos of the completed repair (JPG, PNG)</span></div>' +
        '<input type="file" accept="image/*" multiple style="display:none" onchange="A.comp.addImages(this.files)" /></label>' + imgGrid + '</div>' +
        '<div class="field"><label>Voice note (optional)</label>' +
        (d.audio ? compPreviewHtml(d.audio) : '<div class="drop-pill" onclick="A.comp.rec()">' + ic('mic', { s: 15 }) + ' Record Voice Summary</div>') + recRow + '</div>' +
        '<button class="btn btn-primary btn-lg btn-block" style="margin-top:6px" onclick="A.comp.submit()">' + ic('checkC', { s: 16 }) + ' Mark Complete &amp; Send Proof</button>' +
        '</div>',
        {
          onMount: function () {
            const el = UI._modalEl;
            const close = el ? el.querySelector('[data-close]') : null;
            if (close) close.addEventListener('click', function () { RepairsActions.comp.cancel(); });
          }
        }
      );
    },
    note: function (v) { if (compDraft) compDraft.note = v; },
    addImages: function (files) {
      if (!compDraft) return;
      Array.from(files).slice(0, 6 - compDraft.images.length).forEach(function (f) {
        const rd = new FileReader();
        rd.onload = function () { if (compDraft) { compDraft.images.push(rd.result); RepairsActions.comp.render(); } };
        rd.readAsDataURL(f);
      });
    },
    delImage: function (i) { if (compDraft) { compDraft.images.splice(i, 1); this.render(); } },
    rec: function () {
      if (!compDraft) return;
      if (recState && recState.active) { this.stopRec(); return; }
      recState = { active: true, sec: 0, dataUrl: null };
      const timer = setInterval(function () {
        if (recState) {
          recState.sec++;
          const el = document.getElementById('recTimer');
          if (el) el.textContent = '0:' + String(Math.min(99, recState.sec)).padStart(2, '0');
        }
      }, 1000);
      recState.timer = timer;
      this.render();
      if (navigator.mediaDevices && window.MediaRecorder) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          if (!recState || !recState.active) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
          const mr = new MediaRecorder(stream);
          const chunks = [];
          mr.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
          mr.onstop = function () {
            stream.getTracks().forEach(function (t) { t.stop(); });
            if (!recState) return;
            const bl = new Blob(chunks, { type: 'audio/webm' });
            recState.dataUrl = bl.size > 0 ? URL.createObjectURL(bl) : wavUri(recState.sec || 1);
          };
          mr.start();
          recState.mr = mr;
        }).catch(function () {
          UI.toast('Microphone unavailable — using simulated recording.', 'danger', 'Notice');
        });
      } else {
        UI.toast('Recording simulated — voice summary will be generated.', 'ok', 'Recording');
      }
    },
    stopRec: function () {
      if (!recState) return;
      if (recState.active) {
        recState.active = false;
        clearInterval(recState.timer);
        const secs = Math.max(1, recState.sec);
        if (recState.mr) {
          try { recState.mr.stop(); } catch (e) { }
          setTimeout(function () {
            const uri = recState && recState.dataUrl ? recState.dataUrl : wavUri(secs);
            if (compDraft) compDraft.audio = { uri: uri, duration: secs, label: 'Voice summary' };
            recState = null;
            RepairsActions.comp.render();
          }, 350);
          return;
        }
        if (!recState.dataUrl) recState.dataUrl = wavUri(secs);
        if (compDraft) compDraft.audio = { uri: recState.dataUrl, duration: secs, label: 'Voice summary' };
        recState = null;
        this.render();
      }
    },
    delAudio: function () { if (compDraft) { compDraft.audio = null; this.render(); } },
    submit: function () {
      if (!compDraft) return;
      if (!compDraft.note.trim() && !compDraft.images.length && !compDraft.audio) {
        UI.toast('Add a short summary or photo proof so the customer can see the work is done.', 'danger', 'Proof required');
        return;
      }
      const res = Store.workerCompleteRepair(compDraft.jobId, { note: compDraft.note, images: compDraft.images, audio: compDraft.audio });
      if (res.error) { UI.toast(res.error, 'danger', 'Cannot complete'); return; }
      compDraft = null;
      UI.closeModal();
      UI.toast('Job completed with proof. The customer has been notified.', 'ok', 'Job completed');
      if (window.go) window.go('/worker/active/' + res.job.id);
    },
    cancel: function () {
      if (recState) {
        if (recState.active) { recState.active = false; clearInterval(recState.timer); }
        if (recState.mr) { try { recState.mr.stop(); } catch (e) { } }
        recState = null;
      }
      compDraft = null;
      UI.closeModal();
    }
  }
};
