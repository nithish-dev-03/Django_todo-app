/* Fallback shell behaviour. Vanilla, no build step, defensive: the whole point
   of this page is that it renders even when the main bundle is broken. */

(function () {
  'use strict'

  var doc = document
  var root = doc.documentElement
  var body = doc.body

  var $ = function (sel, ctx) {
    return (ctx || doc).querySelector(sel)
  }
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel))
  }

  /* ---------- Theme ---------- */

  var THEME_KEY = 'taskflow:fallback-theme'

  function readTheme() {
    try {
      var saved = localStorage.getItem(THEME_KEY)
      if (saved === 'dark' || saved === 'light') return saved
    } catch (e) {
      /* private mode — fall through to system preference */
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark'
  }

  function applyTheme(next) {
    root.setAttribute('data-theme', next)
    body.setAttribute('data-theme', next)
    var quiet = $('[data-theme-toggle-2]')
    if (quiet) quiet.textContent = next === 'dark' ? 'Light theme' : 'Dark theme'
  }

  function toggleTheme() {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch (e) {
      /* non-persistent is acceptable */
    }
  }

  /* ---------- Toast ---------- */

  var toastEl = $('[data-toast]')
  var toastTimer = null

  function toast(message) {
    if (!toastEl) return
    toastEl.textContent = message
    toastEl.classList.add('is-on')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-on')
    }, 1800)
  }

  /* ---------- Copy ---------- */

  function copyText(text, label) {
    var done = function () {
      toast(label + ' copied')
    }
    var fail = function () {
      toast('Copy blocked — select the text manually')
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () {
        legacyCopy(text, done, fail)
      })
      return
    }
    legacyCopy(text, done, fail)
  }

  function legacyCopy(text, done, fail) {
    var ta = doc.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0'
    body.appendChild(ta)
    ta.select()
    try {
      doc.execCommand('copy') ? done() : fail()
    } catch (e) {
      fail()
    }
    body.removeChild(ta)
  }

  /* ---------- Diagnostic report ---------- */

  function collectRows(view) {
    return $$('.fx-kv > div', view).map(function (row) {
      var dt = $('dt', row)
      var dd = $('dd', row)
      if (!dt || !dd) return null
      return [dt.textContent.trim(), dd.textContent.trim()]
    }).filter(Boolean)
  }

  function buildReport() {
    var lines = [
      'Taskflow — fallback diagnostic report',
      '====================================',
      '',
      'severity : ' + (body.getAttribute('data-severity') || 'error'),
      'raised   : ' + new Date().toISOString(),
      'page     : ' + window.location.href,
      ''
    ]

    var summary = $('.fx-view__path')
    if (summary) {
      lines.push('summary  : ' + summary.textContent.trim())
      lines.push('')
    }

    var trace = $('[data-trace]')
    if (trace) {
      lines.push('--- traceback ---')
      lines.push(trace.textContent.trim())
      lines.push('')
    }

    var req = $('[data-view="request"]')
    if (req) {
      lines.push('--- request ---')
      collectRows(req).forEach(function (row) {
        lines.push(row[0].padEnd(10, ' ') + ' : ' + row[1])
      })
      lines.push('')
    }

    var env = $('[data-view="env"]')
    if (env) {
      lines.push('--- environment ---')
      collectRows(env).forEach(function (row) {
        lines.push(row[0].padEnd(10, ' ') + ' : ' + row[1])
      })
      lines.push('')
    }

    lines.push('--- browser ---')
    lines.push('navigator : ' + navigator.userAgent)
    lines.push('viewport  : ' + window.innerWidth + 'x' + window.innerHeight)
    lines.push('theme     : ' + root.getAttribute('data-theme'))
    lines.push('online    : ' + navigator.onLine)

    return lines.join('\n')
  }

  function textOf(sel) {
    var el = $(sel)
    return el ? el.textContent.trim() : ''
  }

  /* ---------- Auto-retry countdown ---------- */

  var retryUrl = body.getAttribute('data-retry-url') || '/'
  var seconds = parseInt(body.getAttribute('data-retry-after'), 10)
  var retryTimer = null
  var remaining = 0

  var progressWrap = $('[data-progress-wrap]')
  var progressFill = $('[data-progress-fill]')
  var countEl = $('[data-retry-count]')

  function armRetry() {
    if (!progressWrap || !Number.isFinite(seconds) || seconds <= 0) return
    remaining = seconds
    progressWrap.hidden = false
    if (countEl) countEl.hidden = false
    tick()
    clearInterval(retryTimer)
    retryTimer = setInterval(tick, 1000)
  }

  function tick() {
    remaining -= 1
    var ratio = Math.max(0, remaining / seconds)
    if (progressFill) progressFill.style.width = (ratio * 100).toFixed(2) + '%'
    if (countEl) countEl.textContent = Math.max(0, remaining) + 's'
    if (remaining <= 0) {
      clearInterval(retryTimer)
      retryTimer = null
      go()
    }
  }

  function cancelRetry(silent) {
    clearInterval(retryTimer)
    retryTimer = null
    if (progressWrap) progressWrap.hidden = true
    if (countEl) {
      countEl.hidden = true
      countEl.textContent = ''
    }
    if (!silent) toast('Auto-retry cancelled')
  }

  function go() {
    try {
      window.location.replace(retryUrl)
    } catch (e) {
      window.location.href = retryUrl
    }
  }

  /* ---------- Tabs ---------- */

  function selectTab(name) {
    $$('.fx-tab').forEach(function (tab) {
      var on = tab.getAttribute('data-tab') === name
      tab.classList.toggle('is-active', on)
      tab.setAttribute('aria-selected', on ? 'true' : 'false')
    })
    $$('.fx-view').forEach(function (view) {
      var on = view.getAttribute('data-view') === name
      view.classList.toggle('is-active', on)
      view.hidden = !on
    })
    try {
      localStorage.setItem('taskflow:fallback-tab', name)
    } catch (e) {
      /* ignore */
    }
  }

  /* ---------- Trace clamp ---------- */

  var THRESHOLD = 8

  function clampTrace() {
    var trace = $('[data-trace]')
    var more = $('[data-more]')
    if (!trace || !more) return

    var lines = trace.textContent.split('\n')
    if (lines.length <= THRESHOLD) return

    trace.classList.add('is-clamped')
    more.hidden = false
    more.addEventListener('click', function () {
      var open = trace.classList.toggle('is-clamped')
      more.firstChild.textContent = open ? ' show full trace' : ' collapse trace'
    })
  }

  /* ---------- Clocks ---------- */

  var clockEl = $('[data-clock]')
  var uptimeEl = $('[data-uptime]')
  var startedAt = Date.now()

  function pad(n) {
    return n < 10 ? '0' + n : String(n)
  }

  function tickClocks() {
    var now = new Date()
    if (clockEl) {
      clockEl.textContent =
        pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds())
    }
    if (uptimeEl) {
      var total = Math.floor((Date.now() - startedAt) / 1000)
      uptimeEl.textContent =
        'session ' +
        pad(Math.floor(total / 3600)) +
        ':' +
        pad(Math.floor((total % 3600) / 60)) +
        ':' +
        pad(total % 60)
    }
  }

  /* ---------- Wire up ---------- */

  function init() {
    applyTheme(readTheme())

    $$('[data-theme-toggle], [data-theme-toggle-2]').forEach(function (el) {
      el.addEventListener('click', toggleTheme)
    })

    $$('.fx-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        selectTab(tab.getAttribute('data-tab'))
      })
    })

    var retryBtn = $('[data-retry]')
    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        cancelRetry(true)
        go()
      })
    }

    var cancelBtn = $('[data-retry-cancel]')
    if (cancelBtn) cancelBtn.addEventListener('click', function () {
      cancelRetry(false)
    })

    var copyTrace = $('[data-copy-trace]')
    if (copyTrace) {
      copyTrace.addEventListener('click', function () {
        copyText(textOf('[data-trace]'), 'Traceback')
      })
    }

    var copyReport = $('[data-copy-report]')
    if (copyReport) {
      copyReport.addEventListener('click', function () {
        copyText(buildReport(), 'Report')
      })
    }

    doc.addEventListener('keydown', function (event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      var tag = (event.target && event.target.tagName) || ''
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable) return

      var key = event.key.toLowerCase()
      if (key === 'r') {
        cancelRetry(true)
        go()
      } else if (key === 't') {
        toggleTheme()
      } else if (key === 'c') {
        copyText(buildReport(), 'Report')
      } else if (key === 'escape') {
        cancelRetry(false)
      }
    })

    // Don't navigate out from under someone mid-countdown.
    window.addEventListener('pagehide', function () {
      clearInterval(retryTimer)
    })

    // Flip the severity dot to "offline" if the network dropped underneath us.
    window.addEventListener('offline', function () {
      var chip = $('[data-severity-chip]')
      if (chip) chip.lastChild.textContent = ' offline '
    })
    window.addEventListener('online', function () {
      var chip = $('[data-severity-chip]')
      if (chip) {
        chip.lastChild.textContent = ' ' + (body.getAttribute('data-severity') || 'error') + ' '
      }
    })

    clampTrace()
    tickClocks()
    setInterval(tickClocks, 1000)

    var savedTab = null
    try {
      savedTab = localStorage.getItem('taskflow:fallback-tab')
    } catch (e) {
      /* ignore */
    }
    selectTab(savedTab === 'request' || savedTab === 'env' ? savedTab : 'trace')

    armRetry()
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()