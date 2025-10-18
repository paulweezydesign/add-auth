import { JSDOM } from 'jsdom';
import React from 'react';
import { createRoot } from 'react-dom/client';
import * as TestUtils from 'react-dom/test-utils';
import { AuthForm, AuthFormSubmitResult, AuthFormValues } from '../src/ui/react/AuthForm';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runReactDemo() {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
  });

  (global as any).window = dom.window;
  (global as any).document = dom.window.document;
  (global as any).navigator = { userAgent: 'demo' };

  const rootElement = dom.window.document.getElementById('root');
  if (!rootElement) {
    throw new Error('Unable to find root element for demo');
  }

  let submittedValues: AuthFormValues | undefined;
  const onSubmit = async (values: AuthFormValues): Promise<AuthFormSubmitResult> => {
    submittedValues = values;
    await delay(10);
    return {
      ok: true,
      message: `Welcome back, ${values.email}!`,
      data: { token: 'demo-token' },
    };
  };

  const root = createRoot(rootElement);

  await TestUtils.act(async () => {
    root.render(
      React.createElement(AuthForm, {
        onSubmit,
        initialEmail: 'demo@example.com',
        successMessage: 'Signed in via demo',
      })
    );
  });

  const emailInput = rootElement.querySelector('input[name="email"]') as HTMLInputElement | null;
  const passwordInput = rootElement.querySelector('input[name="password"]') as HTMLInputElement | null;
  const rememberCheckbox = rootElement.querySelector('input[name="rememberMe"]') as HTMLInputElement | null;
  const form = rootElement.querySelector('form') as HTMLFormElement | null;

  if (!emailInput || !passwordInput || !rememberCheckbox || !form) {
    throw new Error('Demo inputs were not rendered correctly');
  }

  await TestUtils.act(async () => {
    TestUtils.Simulate.change(emailInput, {
      target: { value: 'react-user@example.com', name: 'email' },
    } as any);
    TestUtils.Simulate.change(passwordInput, {
      target: { value: 'MySecurePassword!123', name: 'password' },
    } as any);
    TestUtils.Simulate.change(rememberCheckbox, {
      target: { checked: true, name: 'rememberMe', type: 'checkbox' },
    } as any);
  });

  await TestUtils.act(async () => {
    TestUtils.Simulate.submit(form);
    await delay(20);
  });

  const statusMessage = rootElement.querySelector('.aa-success')?.textContent?.trim();

  root.unmount();

  return {
    submittedValues,
    statusMessage,
  };
}

runReactDemo()
  .then((result) => {
    if (!result.submittedValues) {
      throw new Error('React demo did not capture submitted values');
    }

    console.log('React demo rendered successfully.');
    console.log('Submitted values:', result.submittedValues);
    console.log('Status message:', result.statusMessage);
  })
  .catch((error) => {
    console.error('React demo failed:', error);
    process.exitCode = 1;
  });
