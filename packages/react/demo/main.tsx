// A live example for the GGDS documentation: a service page built only from @ggds/react components, with a form
// that checks its answers in React and shows errors the GGDS way. Built by packages/react/build.mjs with Vite.
import '@ggds/css/ggds.css';
import { StrictMode, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Banner, Breadcrumbs, Button, ErrorSummary, Footer, Header, Notice, Radios, SkipLink, TabBar, TextInput,
} from '../src/index.js';

const NAV = [
  { label: 'Services', href: '#services' },
  { label: 'Laws & regulations', href: '#laws' },
  { label: 'About & contact', href: '#about' },
];

type Errors = Partial<Record<'fullName' | 'phone' | 'business', string>>;

function check(form: FormData): Errors {
  const errors: Errors = {};
  const name = String(form.get('fullName') ?? '').trim();
  const phone = String(form.get('phone') ?? '').replace(/\s/g, '');
  if (!name) errors.fullName = 'Enter your full name';
  if (!phone) errors.phone = 'Enter your mobile phone number';
  else if (!/^0\d{9}$/.test(phone)) errors.phone = 'Enter a mobile phone number with 10 digits, like 024 123 4567';
  if (!form.get('business')) errors.business = 'Select the type of business';
  return errors;
}

function App() {
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const title = 'Apply for a business permit';

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = check(new FormData(event.currentTarget));
    setErrors(found);
    const any = Object.keys(found).length > 0;
    document.title = `${any ? 'Error: ' : ''}${title} | Example Agency (React example)`;
    if (!any) setSent(true);
  };

  const summary = [
    errors.fullName && { href: '#fullName', text: errors.fullName },
    errors.phone && { href: '#phone', text: errors.phone },
    errors.business && { href: '#business-sole', text: errors.business },
  ].filter((e): e is { href: string; text: string } => Boolean(e));

  return (
    <>
      <SkipLink />
      <Banner shortName="Example Agency" host="www.example.gov.gh" official />
      <Header name="Example Agency" initials="EA" nav={NAV} current="#services" home="#" search={false} />
      <main className="ggds-main ggds-container" id="main" tabIndex={-1}>
        <Breadcrumbs items={[{ label: 'Home', href: '#' }, { label: 'Services', href: '#services' }]} current={title} />
        {sent ? (
          <>
            <h1>Application sent</h1>
            <Notice type="success" title="We have your application">
              <p>This is an example: nothing was sent. In your service, your server checks the answers again and saves them.</p>
            </Notice>
          </>
        ) : (
          <>
            <ErrorSummary errors={summary} />
            <h1>{title}</h1>
            <p className="ggds-lead ggds-measure">This page is built with @ggds/react. Send the form empty to see the errors.</p>
            <form onSubmit={onSubmit} noValidate>
              <TextInput id="fullName" name="fullName" label="Full name" hint="As shown on your Ghana Card" width="long" autoComplete="name" spellCheck={false} error={errors.fullName} />
              <TextInput id="phone" name="phone" type="tel" label="Mobile phone number" hint="For example, 024 123 4567" width="medium" autoComplete="tel" inputMode="tel" error={errors.phone} />
              <Radios name="business" legend="What type of business is it?" error={errors.business}
                items={[{ value: 'sole', label: 'Sole proprietor' }, { value: 'partnership', label: 'Partnership' }, { value: 'company', label: 'Limited company' }]} />
              <Button type="submit">Send application</Button>
            </form>
          </>
        )}
      </main>
      <Footer name="Example Agency" purpose="We license businesses and protect consumers." bar={[{ label: 'Accessibility', href: '#accessibility' }, { label: 'Privacy', href: '#privacy' }]} />
      <TabBar tabs={[{ label: 'Home', href: '#', icon: 'home' }, { label: 'Services', href: '#services', icon: 'services', current: true }, { label: 'Help', href: '#help', icon: 'help' }]} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
