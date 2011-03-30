(function($, Sammy) {

    Sammy = Sammy || {};

    Sammy.FormValidator = function(app) {
        app.use('Mustache', 'mustache');

        var ms = app.context_prototype.prototype.mustache;

        var FormValidator = {
            MESSAGES: {
                maxlength: "Too long",
                minlength: "Too short",
                required: "This field is required",
                pattern: "Not a valid "
            },

            validateField: function(input) {
                var ctx = this,
                    $input = $(input),
                    attrs = ['required', 'maxlength', 'pattern'];

                if ($input.hasClass('input-error') || !($input.hasClass('input-valid'))) {
                    $.each(attrs, function(index) {
                        if ($input.data('h5-' + attrs[index])) {
                            ctx.Messenger.appendErrorMessage(attrs[index], $input);
                        }
                    });
                } else if ($input.hasClass('input-valid')) {
                    FormValidator.Messenger.hideInputError($input);
                }
            }
        };


        //
        // Logic for displaying and hiding form messages
        //
        FormValidator.Messenger = {
            formMessage: function(form, template, tempData) {
                var ctx = this;
                $(form).find('.submit-error, .submit-success')
                       .remove()
                       .end()
                       .find('input[type=submit]')
                       .after(ms(template, tempData));
            },

            appendErrorMessage: function(attr, $input) {
                var validator = FormValidator,
                    value = $input.val().toLowerCase(),
                    ctx = this;

                switch (attr) {
                case 'maxlength':
                    if (value.length > $input.attr('maxlength')) {
                        ctx.showInputError($input, FormValidator.MESSAGES.maxlength);
                        return false;
                    }
                    break;
                case 'required':
                    if (value.length === 0) {
                        ctx.showInputError($input, FormValidator.MESSAGES.required);
                        return false;
                    }
                    break;
                case 'pattern':
                    if ($input.data('h5-pattern').test(value) === false) {
                        if($input.hasClass('h5-minLength')) {
                            ctx.showInputError($input, FormValidator.MESSAGES.minlength);
                        } else if ($input.hasClass('h5-email')) {
                            ctx.showInputError($input, FormValidator.MESSAGES.pattern + 'email');
                        } else {
                            ctx.showInputError($input, FormValidator.MESSAGES.pattern + 'URL');
                        }
                        return false;
                    } else {
                        $input.removeClass('input-error');
                    }
                    break;
                }
            },

            showInputError: function($input, msg) {
                var template = '<div class="error-msg">{{msg}}</div>',
                    result = ms(template, { msg: msg }),
                    ctx = this;

                if ($input.prev('.error-msg').length !== 0) {
                    ctx.hideInputError($input).before(result);
                } else {
                    $input.before(result);
                }
            },

            // Returns $input
            hideInputError: function($input) {
                return $input.prev('.error-msg').remove().end();
            }
        };


        //
        // Handle form submission
        //
        FormValidator.Submitter = {
            processSubmission: function(success, form, template, data) {
                $(form).remove('.submit-error, .submit-success');

                if (success) {
                    FormValidator.Messenger.formMessage(form, template, data);
                    this.clearForm($(form));
                } else {
                    FormValidator.Messenger.formMessage(form, template, data);
                }
            },

            clearForm: function($scope) {
                $scope.find('input:not([type=submit]), textarea').val('');
            }
        };


        this.helpers({
            validate: function(input) {
                FormValidator.validateField(input);
            },

            successfulSubmission: function(form, template, data) {
                FormValidator.Submitter.processSubmission(true, form, template, data);
            },

            unSuccessfulSubmission: function(form, template, data) {
                FormValidator.Submitter.processSubmission(false, form, template, data);
            },

            clearForm: function(form) {
                FormValidator.Submitter.clearForm($(form));
            }
        });
    };

})(jQuery, window.Sammy);
