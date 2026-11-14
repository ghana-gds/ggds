"""The task list, password input, code input, prefix and suffix, dialog and timeout warning output the same elements,
classes and meaningful attributes as their GGDS documentation examples, and the code field cleans what people type."""
from django import forms
from django.test import SimpleTestCase, override_settings

from ggds_django.forms import AffixInput, OneTimeCodeField
from .test_new_components import example, render, shape

TASKS = [
    {"id": "details", "label": "Your details", "href": "#details", "status": "completed"},
    {"id": "canoe", "label": "About your canoe", "href": "#canoe", "status": "completed"},
    {"id": "documents", "label": "Upload your documents", "href": "#documents", "status": "inProgress",
     "hint": "Your Ghana Card and a photo of the canoe"},
    {"id": "landing", "label": "Your landing beach", "href": "#landing", "status": "notStarted"},
    {"id": "pay", "label": "Pay the fee", "status": "cannotStart", "hint": "You can pay once the other sections are complete"},
]


class SignInForm(forms.Form):
    password = forms.CharField(label="Password", widget=forms.PasswordInput)


class NewPasswordForm(forms.Form):
    newPassword = forms.CharField(label="Create a password", help_text="At least 8 characters",
                                  widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}))


class CodeForm(forms.Form):
    code = OneTimeCodeField(label="Enter the code we sent you",
                            help_text="We sent a 6-digit code to 024 *** 4567. It expires in 10 minutes.")


class AmountForm(forms.Form):
    amount = forms.CharField(label="How much do you want to pay, in Ghana cedis?", help_text="For example, 150.00",
                             widget=AffixInput(attrs={"class": "ggds-input--width-short"}, prefix="GH₵"))
    catch = forms.CharField(label="Weight of the catch, in kilograms",
                            widget=AffixInput(attrs={"class": "ggds-input--width-short"}, suffix="kg"))


@override_settings(FORM_RENDERER="ggds_django.forms.GGDSFormRenderer")
class TransactionalTests(SimpleTestCase):
    def test_task_list(self):
        html = render("{% ggds_task_list tasks %}", tasks=TASKS)
        self.assertEqual(shape(html), shape(example("task-list/examples/1-application.html"))[1:])
        self.assertIn("You have completed 2 of 5 sections.", html)

    def test_task_list_rejects_an_unknown_status(self):
        with self.assertRaises(ValueError):
            render("{% ggds_task_list tasks %}", tasks=[{"label": "A", "status": "done"}])

    def test_password_input(self):
        html = SignInForm(auto_id="%s")["password"].as_field_group()
        self.assertEqual(shape(html), shape(example("password-input/examples/1-sign-in.html")))
        self.assertIn('autocomplete="current-password"', html)
        self.assertIn('data-ggds-show="Show"', html)

    def test_password_input_with_an_error(self):
        form = NewPasswordForm(data={"newPassword": ""}, auto_id="%s")
        form.is_valid()
        form.errors["newPassword"] = form.error_class(["Your password must have at least 8 characters"])
        html = form["newPassword"].as_field_group()
        # Django names the ids after the field; the example's ids are new-password. The name stays newPassword.
        for a, b in (('for="newPassword"', 'for="new-password"'), ('id="newPassword', 'id="new-password'),
                     ('"newPassword-', '"new-password-'), (' newPassword-', ' new-password-'),
                     ('aria-controls="newPassword"', 'aria-controls="new-password"')):
            html = html.replace(a, b)
        self.assertEqual(shape(html), shape(example("password-input/examples/2-new-password.html")))
        self.assertIn('autocomplete="new-password"', html)

    def test_code_input(self):
        html = CodeForm(auto_id="%s")["code"].as_field_group()
        self.assertEqual(shape(html), shape(example("code-input/examples/1-sms-code.html"))[:4])
        self.assertIn('autocomplete="one-time-code"', html)
        self.assertIn('inputmode="numeric"', html)

    def test_code_field_cleans_spaces_and_dashes_and_keeps_zeros(self):
        form = CodeForm(data={"code": " 012-345 "})
        self.assertTrue(form.is_valid(), form.errors)
        self.assertEqual(form.cleaned_data["code"], "012345")
        self.assertEqual(CodeForm(data={"code": ""}).errors["code"], ["Enter the code we sent you"])
        self.assertEqual(CodeForm(data={"code": "12a456"}).errors["code"], ["Enter the 6-digit code we sent you"])
        self.assertEqual(CodeForm(data={"code": "12345"}).errors["code"], ["Enter the 6-digit code we sent you"])

    def test_prefix_and_suffix(self):
        form = AmountForm(auto_id="%s")
        html = form["amount"].as_field_group() + form["catch"].as_field_group()
        self.assertEqual(shape(html), shape(example("field/examples/7-prefix-suffix.html")))
        self.assertIn('inputmode="decimal"', html)

    def test_dialog(self):
        html = render('{% ggds_dialog id="delete-draft" title="Delete this draft?" body="Your answers will be deleted. You cannot get them back." action="#delete-draft-page" confirm="Delete draft" warning=True %}')
        self.assertEqual(shape(html), shape(example("dialog/examples/1-confirm.html"))[2:])
        self.assertIn(">Cancel</button>", html)

    def test_timeout_warning(self):
        html = render('{% ggds_timeout_warning timeout=123 keep_alive="#keep-alive" sign_out="#signed-out" %}')
        self.assertEqual(shape(html), shape(example("timeout-warning/examples/1-default.html"))[1:])
        self.assertIn('data-ggds-timeout="123"', html)
        self.assertRegex(html, r'we will sign you out in <span class="ggds-timeout-warning__time">2 minutes</span>\.</p>')

    def test_code_field_takes_only_0_to_9_and_keeps_empty_values(self):
        self.assertEqual(CodeForm(data={"code": "²³⁴⁵⁶⁷"}).errors["code"], ["Enter the 6-digit code we sent you"])
        self.assertEqual(CodeForm(data={"code": "١٢٣٤٥٦"}).errors["code"], ["Enter the 6-digit code we sent you"])

        class Optional(forms.Form):
            code = OneTimeCodeField(required=False, empty_value=None)
        form = Optional(data={"code": ""})
        self.assertTrue(form.is_valid(), form.errors)
        self.assertIsNone(form.cleaned_data["code"])

    def test_task_list_id_prefix(self):
        html = render('{% ggds_task_list tasks id_prefix="renewal" %}', tasks=TASKS[:1])
        self.assertIn('id="renewal-details-status"', html)
