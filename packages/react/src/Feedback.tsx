import { t, type StringsProp } from './util.js';

export interface FeedbackProps {
  /** Where the answer is sent (POST): your server counts the Yes and No answers for each page. */
  action: string;
  /** The page's address, sent with the answer in the hidden "page" field. */
  page: string;
  /** A form to report a problem with the page. It is given ?page= with the page's address. */
  reportHref?: string;
  /** After an answer: say thank you instead of asking again. */
  answered?: boolean;
  strings?: StringsProp;
}

/** At the end of a page: "Did this page help you?" with Yes and No, sent as an ordinary form, and a report link. */
export function Feedback({ action, page, reportHref, answered = false, strings }: FeedbackProps) {
  const report = reportHref ? (
    <p className="ggds-feedback__report"><a href={`${reportHref}${reportHref.includes('?') ? '&' : '?'}page=${encodeURI(page)}`}>{t(strings, 'feedback.report')}</a></p>
  ) : null;
  if (answered) {
    return (
      <section className="ggds-feedback" aria-labelledby="ggds-feedback-title">
        <p className="ggds-feedback__thanks" id="ggds-feedback-title" role="status" tabIndex={-1}>{t(strings, 'feedback.thanks')}</p>
        {report}
      </section>
    );
  }
  return (
    <section className="ggds-feedback" aria-labelledby="ggds-feedback-title">
      <form className="ggds-feedback__form" action={action} method="post">
        <input type="hidden" name="page" value={page} />
        <h2 className="ggds-feedback__title" id="ggds-feedback-title">{t(strings, 'feedback.question')}</h2>
        <div className="ggds-feedback__answers">
          <button className="ggds-button ggds-button--secondary ggds-feedback__answer" type="submit" name="helpful" value="yes">{t(strings, 'feedback.yes')} <span className="ggds-visually-hidden">{t(strings, 'feedback.yesHidden')}</span></button>
          <button className="ggds-button ggds-button--secondary ggds-feedback__answer" type="submit" name="helpful" value="no">{t(strings, 'feedback.no')} <span className="ggds-visually-hidden">{t(strings, 'feedback.noHidden')}</span></button>
        </div>
      </form>
      {report}
    </section>
  );
}
