from django import forms
from django.template import Context, Template
from django.test import SimpleTestCase


class ComplaintForm(forms.Form):
    name = forms.CharField(label="Full name", help_text="As on your Ghana Card")
    email = forms.EmailField(label="Email address", required=False)
    contact = forms.ChoiceField(label="How should we contact you?", widget=forms.RadioSelect,
                                choices=[("call", "Phone call"), ("sms", "SMS")])
    provider = forms.ChoiceField(label="Provider", choices=[("", "Choose"), ("a", "A")])
    details = forms.CharField(label="What happened?", widget=forms.Textarea)
    topics = forms.MultipleChoiceField(label="Topics", widget=forms.CheckboxSelectMultiple, required=False,
                                       choices=[("net", "Internet"), ("tv", "Television")])
    agree = forms.BooleanField(label="I agree")


class FormRenderingTests(SimpleTestCase):
    def test_unbound_form_uses_ggds_controls_and_labels(self):
        html = str(ComplaintForm())
        self.assertNotIn("ggds-error-summary", html)
        self.assertInHTML('<label class="ggds-label" for="id_name">Full name</label>', html)
        self.assertIn('class="ggds-input"', html)
        self.assertIn('class="ggds-textarea"', html)
        self.assertIn('class="ggds-select"', html)
        self.assertIn('<p class="ggds-hint" id="id_name-hint">As on your Ghana Card</p>', html)
        self.assertIn('aria-describedby="id_name-hint"', html)
        self.assertInHTML('<label class="ggds-label" for="id_email">Email address (optional)</label>', html)
        self.assertInHTML('<legend class="ggds-fieldset__legend">How should we contact you?</legend>', html)
        self.assertIn('id="id_contact_0"', html)
        self.assertIn('class="ggds-choice__input"', html)

    def test_errors_are_summarised_linked_and_tied_to_their_fields(self):
        form = ComplaintForm(data={"email": "not-an-email"})
        html = str(form)
        self.assertIn('class="ggds-error-summary" role="alert" tabindex="-1" data-ggds-module="error-summary"', html)
        self.assertIn('href="#id_name"', html)
        # A radio group's error links to its first option, which can take focus (not to the group).
        self.assertIn('href="#id_contact_0"', html)
        self.assertIn('id="id_contact_0"', html)
        self.assertIn('href="#id_email"', html)
        self.assertIn('<div class="ggds-field ggds-field--error">', html)
        self.assertIn('aria-describedby="id_name-hint id_name-error"', html)
        self.assertIn('aria-invalid="true"', html)
        self.assertIn('<span class="ggds-visually-hidden">Error: </span>', html)
        self.assertIn('<fieldset class="ggds-fieldset" aria-describedby="id_contact-error">', html)

    def test_checkbox_groups_are_not_all_required(self):
        html = str(ComplaintForm()["topics"].as_field_group())
        self.assertEqual(html.count('type="checkbox"'), 2)
        self.assertNotIn("required", html)

    def test_selected_choices_stay_selected(self):
        html = str(ComplaintForm(data={"contact": "sms", "topics": ["tv"]})["contact"].as_field_group())
        self.assertRegex(html, r'<input[^>]*id="id_contact_1"[^>]*checked')

    def test_error_title(self):
        form = ComplaintForm(data={})
        out = Template('{% load ggds %}{% ggds_error_title form "Make a complaint" %}').render(Context({"form": form}))
        self.assertEqual(out, "Error: Make a complaint")
