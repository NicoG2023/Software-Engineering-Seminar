<#import "template.ftl" as layout>
<#import "user-profile-commons.ftl" as userProfileCommons>
<#import "register-commons.ftl" as registerCommons>

<@layout.registrationLayout displayMessage=messagesPerField.exists('global') displayRequiredFields=false; section>

  <#if section = "header">
    <header class="kc-header">
      <div class="logo">C</div><span>cinema</span>
    </header>
    <h2 class="kc-subtitle">Register</h2>

  <#elseif section = "form">
    <form id="kc-register-form" class="${properties.kcFormClass!}" action="${url.registrationAction}" method="post">

      <@userProfileCommons.userProfileFormFields; callback, attribute>
        <#if callback = "afterField">
          <#-- Renderiza los passwords justo después de username/email (como hace KC por defecto) -->
          <#if passwordRequired?? && (attribute.name == 'username' || (attribute.name == 'email' && realm.registrationEmailAsUsername))>

            <div class="${properties.kcFormGroupClass!}">
              <div class="${properties.kcLabelWrapperClass!}">
                <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label> *
              </div>
              <div class="${properties.kcInputWrapperClass!}">
                <!-- Grupo de password personalizado -->
                <div class="input-password">
                  <input type="password" id="password" class="${properties.kcInputClass!}" name="password"
                         autocomplete="new-password"
                         aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>" />
                  <button type="button" class="toggle" aria-label="${msg('showPassword')}" aria-controls="password" data-password-toggle>
                    <i class="fa fa-eye" aria-hidden="true"></i>
                  </button>
                </div>

                <#if messagesPerField.existsError('password')>
                  <span id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                    ${kcSanitize(messagesPerField.get('password'))?no_esc}
                  </span>
                </#if>
              </div>
            </div>

            <div class="${properties.kcFormGroupClass!}">
              <div class="${properties.kcLabelWrapperClass!}">
                <label for="password-confirm" class="${properties.kcLabelClass!}">${msg("passwordConfirm")}</label> *
              </div>
              <div class="${properties.kcInputWrapperClass!}">
                <!-- Grupo de confirmación personalizado -->
                <div class="input-password">
                  <input type="password" id="password-confirm" class="${properties.kcInputClass!}" name="password-confirm"
                         autocomplete="new-password"
                         aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>" />
                  <button type="button" class="toggle" aria-label="${msg('showPassword')}" aria-controls="password-confirm" data-password-toggle>
                    <i class="fa fa-eye" aria-hidden="true"></i>
                  </button>
                </div>

                <#if messagesPerField.existsError('password-confirm')>
                  <span id="input-error-password-confirm" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                    ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                  </span>
                </#if>
              </div>
            </div>

          </#if>
        </#if>
      </@userProfileCommons.userProfileFormFields>

      <@registerCommons.termsAcceptance/>

      <#if recaptchaRequired?? && (recaptchaVisible!false)>
        <div class="form-group">
          <div class="${properties.kcInputWrapperClass!}">
            <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}" data-action="${recaptchaAction}"></div>
          </div>
        </div>
      </#if>

      <div class="${properties.kcFormGroupClass!}">
        <div id="kc-form-options" class="${properties.kcFormOptionsClass!}">
          <div class="${properties.kcFormOptionsWrapperClass!}">
            <span><a href="${url.loginUrl}">${kcSanitize(msg("backToLogin"))?no_esc}</a></span>
          </div>
        </div>

        <#if recaptchaRequired?? && !(recaptchaVisible!false)>
          <script>
            function onSubmitRecaptcha(token) {
              document.getElementById("kc-register-form").requestSubmit();
            }
          </script>
          <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
            <button class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!} g-recaptcha"
                    data-sitekey="${recaptchaSiteKey}" data-callback='onSubmitRecaptcha' data-action='${recaptchaAction}' type="submit">
              ${msg("doRegister")}
            </button>
          </div>
        <#else>
          <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
            <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("doRegister")}"/>
          </div>
        </#if>
      </div>
    </form>

    <!-- JS mínimo para toggles de password en register (sin passwordVisibility.js) -->
    <script>
      (function () {
        const wraps = document.querySelectorAll('#kc-register-form .input-password');
        wraps.forEach(wrap => {
          const btn = wrap.querySelector('button.toggle');
          const input = wrap.querySelector('input[type="password"], input[type="text"]');
          if (!btn || !input) return;

          function setState(show) {
            input.type = show ? 'text' : 'password';
            btn.classList.toggle('active', show);
            btn.setAttribute('aria-pressed', String(show));
            btn.dataset.visible = show ? 'true' : 'false';
            const icon = btn.querySelector('i');
            if (icon && icon.classList.contains('fa')) {
              icon.classList.toggle('fa-eye', !show);
              icon.classList.toggle('fa-eye-slash', show);
            }
          }

          btn.addEventListener('click', () => setState(input.type !== 'text'));
        });
      })();
    </script>

  </#if>

</@layout.registrationLayout>
