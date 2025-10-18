import { JSDOM } from 'jsdom';
import {
  AuthWidgetSubmitResult,
  AuthWidgetValues,
  createAuthWidget,
} from '../src/ui/vanilla/createAuthWidget';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runVanillaDemo() {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    url: 'http://localhost/',
  });

  (global as any).window = dom.window;
  (global as any).document = dom.window.document;
  (global as any).navigator = { userAgent: 'demo' };

  let submittedValues: AuthWidgetValues | undefined;
  const widget = createAuthWidget('app', {
    onSubmit: async (values: AuthWidgetValues): Promise<AuthWidgetSubmitResult> => {
      submittedValues = values;
      await delay(10);
      return {
        ok: true,
        message: `Welcome ${values.email}`,
        data: { session: 'vanilla-demo-session' },
      };
    },
    initialEmail: 'vanilla@example.com',
  });

  const form = dom.window.document.querySelector('form');
  const emailInput = dom.window.document.querySelector('input[name="email"]') as HTMLInputElement | null;
  const passwordInput = dom.window.document.querySelector('input[name="password"]') as HTMLInputElement | null;
  const rememberCheckbox = dom.window.document.querySelector('input[name="rememberMe"]') as HTMLInputElement | null;

  if (!form || !emailInput || !passwordInput || !rememberCheckbox) {
    throw new Error('Failed to render vanilla widget form elements');
  }

  emailInput.value = 'vanilla-user@example.com';
  passwordInput.value = 'SuperSecretPassword!';
  rememberCheckbox.checked = true;

  const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(submitEvent);

  await delay(20);

  const successMessage = dom.window.document
    .querySelector('.aa-success')
    ?.textContent?.trim();

  widget.destroy();

  return {
    submittedValues,
    successMessage,
  };
}

runVanillaDemo()
  .then((result) => {
    if (!result.submittedValues) {
      throw new Error('Vanilla demo did not capture submitted values');
    }

    console.log('Vanilla demo rendered successfully.');
    console.log('Submitted values:', result.submittedValues);
    console.log('Status message:', result.successMessage);
  })
  .catch((error) => {
    console.error('Vanilla demo failed:', error);
    process.exitCode = 1;
  });
