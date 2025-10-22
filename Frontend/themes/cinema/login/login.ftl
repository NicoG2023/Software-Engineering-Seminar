<#import "template.ftl" as layout>

<@layout.registrationLayout
    displayMessage=!messagesPerField.existsError('username','password')
    displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??;
    section>

  <#if section = "header">
    <header class="kc-header">
      <div class="logo">C</div><span>cinema</span>
    </header>
    <h2 class="kc-subtitle">Sign In</h2>

  <#elseif section = "form">
    <div id="kc-form">
      <div id="kc-form-wrapper">
        <#if realm.password>
          <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">

            <#if !usernameHidden??>
              <div class="${properties.kcFormGroupClass!}">
                <label for="username" class="${properties.kcLabelClass!}">
                  <#if !realm.loginWithEmailAllowed>
                    ${msg("username")}
                  <#elseif !realm.registrationEmailAsUsername>
                    ${msg("usernameOrEmail")}
                  <#else>
                    ${msg("email")}
                  </#if>
                </label>

                <input tabindex="2" id="username" class="${properties.kcInputClass!}" name="username"
                       value="${(login.username!'')}" type="text" autofocus autocomplete="username"
                       aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" dir="ltr"/>

                <#if messagesPerField.existsError('username','password')>
                  <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                    ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                  </span>
                </#if>
              </div>
            </#if>

            <div class="${properties.kcFormGroupClass!}">
              <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>

              <!-- Grupo de password simplificado y consistente -->
              <div class="input-password">
                <input tabindex="3" id="password" name="password" type="password"
                       class="${properties.kcInputClass!}" autocomplete="current-password"
                       aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"/>

                <button type="button" class="toggle" aria-label="${msg('showPassword')}"
                        aria-controls="password" data-password-toggle>
                  <i class="fa fa-eye" aria-hidden="true"></i>
                </button>
              </div>

              <#if usernameHidden?? && messagesPerField.existsError('username','password')>
                <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                  ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                </span>
              </#if>
            </div>

            <div class="${properties.kcFormGroupClass!} ${properties.kcFormSettingClass!}">
              <div id="kc-form-options">
                <#if realm.rememberMe && !usernameHidden??>
                  <div class="checkbox">
                    <label>
                      <#if login.rememberMe??>
                        <input tabindex="5" id="rememberMe" name="rememberMe" type="checkbox" checked> ${msg("rememberMe")}
                      <#else>
                        <input tabindex="5" id="rememberMe" name="rememberMe" type="checkbox"> ${msg("rememberMe")}
                      </#if>
                    </label>
                  </div>
                </#if>
              </div>

              <div class="${properties.kcFormOptionsWrapperClass!}">
                <#if realm.resetPasswordAllowed>
                  <span><a tabindex="6" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a></span>
                </#if>
              </div>
            </div>

            <div id="kc-form-buttons" class="${properties.kcFormGroupClass!}">
              <input type="hidden" id="id-hidden-input" name="credentialId"
                     <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
              <input tabindex="7"
                     class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                     name="login" id="kc-login" type="submit" value="${msg("doLogIn")}"/>
            </div>

          </form>
        </#if>
      </div>
    </div>

    <script>
        (function () {
            const wrap = document.querySelector('.input-password');
            if (!wrap) return;
            const btn = wrap.querySelector('button.toggle');
            const input = wrap.querySelector('input#password');

            if (!btn || !input) return;

            function setState(show) {
            input.type = show ? 'text' : 'password';
            btn.classList.toggle('active', show);
            btn.setAttribute('aria-pressed', String(show));
            btn.dataset.visible = show ? 'true' : 'false';

            const icon = btn.querySelector('i, svg, span');
            if (icon) {
                // Si usas FontAwesome:
                if (icon.classList.contains('fa')) {
                icon.classList.toggle('fa-eye', !show);
                icon.classList.toggle('fa-eye-slash', show);
                }
            }
            }

            btn.addEventListener('click', () => setState(input.type !== 'text'));
        })();
    </script>


    <!-- Si tu tema ya incluye passwordVisibility.js puedes dejarlo;
         si no existe, quítalo o implementa el toggle con JS propio -->

  <#elseif section = "info">
    <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
      <div id="kc-registration-container">
        <div id="kc-registration">
          <span>${msg("noAccount")}
            <a tabindex="8" href="${url.registrationUrl}">${msg("doRegister")}</a>
          </span>
        </div>
      </div>
    </#if>

  <#elseif section = "socialProviders">
    <#if realm.password && social?? && social.providers?has_content>
      <div id="kc-social-providers" class="${properties.kcFormSocialAccountSectionClass!}">
        <div class="auth-divider"><span>${msg("identity-provider-login-label")}</span></div>

        <ul class="${properties.kcFormSocialAccountListClass!} <#if social.providers?size gt 3>${properties.kcFormSocialAccountListGridClass!}</#if>">
          <#list social.providers as p>
            <li>
              <a id="social-${p.alias}"
                 class="${properties.kcFormSocialAccountListButtonClass!} <#if social.providers?size gt 3>${properties.kcFormSocialAccountGridItem!}</#if>"
                 type="button" href="${p.loginUrl}">
                <#if p.iconClasses?has_content>
                  <i class="${properties.kcCommonLogoIdP!} ${p.iconClasses!}" aria-hidden="true"></i>
                  <span class="${properties.kcFormSocialAccountNameClass!} kc-social-icon-text">${p.displayName!}</span>
                <#else>
                  <span class="${properties.kcFormSocialAccountNameClass!}">${p.displayName!}</span>
                </#if>
              </a>
            </li>
          </#list>
        </ul>
      </div>
    </#if>
  </#if>

</@layout.registrationLayout>
