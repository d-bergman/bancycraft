# Direct feedback delivery

Settings opens a modal for a bug report or suggestion. The recipient is bancywaypoint@gmail.com.

Delivery is intentionally unconfigured until Darren supplies a service endpoint. No mail client is opened, no SMTP password belongs in the app, and no success message appears without service acceptance.

To enable delivery, create a Formspree form with destination bancywaypoint@gmail.com, verify that destination, and supply its `https://formspree.io/f/FORM_ID` URL. Set `endpoint` in `electron/feedback-config.json`, then build/release the app. The endpoint is a public form identifier; never put an account token or Gmail password here. Formspree account limits apply; no paid plan has been added.

Reports include only the entered type, subject, details, optional reply email, selected game and app version. Workspaces, credentials and cipher keys are not automatically attached. Failed or unconfigured submissions retain the in-memory draft. Closing/reopening the modal retains it; quitting the app clears it.

Tests use a mock delivery service, never send a real email. After configuring, perform an explicitly authorized real test and verify inbox receipt before calling delivery complete.
