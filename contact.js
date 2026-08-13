/* ============================================================
   contact.js — contact form submit handler

   POSTs the form (urlencoded — a CORS "simple request", no
   preflight) to the shared Appalachian Cloud contact relay in
   mountain-infra (API Gateway + Lambda: honeypot + server-side
   Turnstile verify + SES). The destination inbox lives server-side
   only — no email address or mailto: anywhere on this site.

   The endpoint URL is Terraform-generated in mountain-infra
   (terraform/lightsail/contact_api.tf). If that API is ever
   recreated, update ENDPOINT here AND the connect-src entry in
   terraform/main.tf's CSP.
   ============================================================ */
(function () {
  'use strict';

  var ENDPOINT = 'https://bep3iwibed.execute-api.us-east-1.amazonaws.com/contact';

  var form = document.getElementById('contact-form');
  var status = document.getElementById('contact-status');
  if (!form || !status) return;

  function setStatus(msg, isError) {
    status.textContent = msg;
    status.classList.toggle('is-error', !!isError);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');

    if (!form.reportValidity()) return;

    btn.disabled = true;
    setStatus('Sending…', false);

    // FormData → URLSearchParams carries the Turnstile-injected
    // cf-turnstile-response field along with the visible inputs.
    fetch(ENDPOINT, {
      method: 'POST',
      body: new URLSearchParams(new FormData(form))
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (r) {
        if (r.ok) {
          form.reset();
          setStatus('Thanks — your message is on its way.', false);
        } else {
          setStatus((r.data && r.data.error) || 'Something went wrong. Please try again.', true);
        }
      })
      .catch(function () {
        setStatus('Network error. Please check your connection and try again.', true);
      })
      .finally(function () {
        btn.disabled = false;
        // Turnstile tokens are single-use — reset so a retry gets a fresh one.
        if (window.turnstile) window.turnstile.reset();
      });
  });
})();
