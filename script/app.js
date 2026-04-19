document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");

    // REGISTRATION FORM LOGIC 
    if (registerForm) {
        registerForm.setAttribute("novalidate", "true"); 
        
        const inputs = registerForm.querySelectorAll("input:not([type='hidden'])");
        const submitBtn = document.getElementById("submitBtn");
        const password = document.getElementById("password");
        const confirm = document.getElementById("confirm");
        const usernameInput = document.getElementById("username");
        const usernameCounter = document.getElementById("usernameCounter");
        const emailInput = document.getElementById("email");

        // Simple email regex (covers most cases)
        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        // Character counter for username
        function updateUsernameCounter() {
            const len = usernameInput.value.length;
            usernameCounter.textContent = ${len}/20;
            if (len >= 18) usernameCounter.style.color = "#f4b400";
            else if (len === 20) usernameCounter.style.color = "#d93025";
            else usernameCounter.style.color = "#666";
        }

        function updateSubmitButtonState() {
            let allValid = true;
            // Check each input's validity (including custom email check)
            if (!usernameInput.validity.valid) allValid = false;
            if (!isValidEmail(emailInput.value) && emailInput.value !== "") allValid = false;
            if (emailInput.value === "") allValid = false;
            if (!password.validity.valid) allValid = false;
            if (confirm.value === "") allValid = false;
            if (password.value !== confirm.value) allValid = false;
            
            submitBtn.disabled = !allValid;
        }

        const debounce = (func, delay = 300) => {
            let timeoutId;
            return (...args) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(null, args), delay);
            };
        };

        // Validation for a single input
        const validateInput = (input) => {
            let existingError = input.parentElement.querySelector(".error-msg");
            if (existingError) existingError.remove();

            let isValid = true;
            let errorMessage = "";

            // Handle email specially
            if (input === emailInput) {
                const email = emailInput.value.trim();
                if (!email) {
                    isValid = false;
                    errorMessage = "Email is required.";
                } else if (!isValidEmail(email)) {
                    isValid = false;
                    errorMessage = "Please enter a valid email address (e.g., name@example.com).";
                }
            } 
            // For other inputs, use browser validation
            else {
                if (!input.validity.valid) {
                    isValid = false;
                    if (input.validity.valueMissing) {
                        errorMessage = "This field is required.";
                    } else if (input.validity.patternMismatch || input.validity.tooShort) {
                        errorMessage = input.title || "Invalid input format."; 
                    }
                }
            }

            // Special case for confirm password
            if (input === confirm && confirm.value !== password.value) {
                isValid = false;
                errorMessage = "Passwords do not match.";
            }

            if (!isValid) {
                input.setAttribute("aria-invalid", "true");
                input.style.borderColor = "#d93025"; 

                const errorSpan = document.createElement("span");
                errorSpan.className = "error-msg";
                errorSpan.style.color = "#d93025";
                errorSpan.style.fontSize = "0.85rem";
                errorSpan.style.display = "block";
                errorSpan.style.marginTop = "4px";
                errorSpan.setAttribute("role", "alert"); 
                errorSpan.textContent = errorMessage;
                
                input.parentElement.appendChild(errorSpan);
            } else {
                input.setAttribute("aria-invalid", "false");
                input.style.borderColor = "#34a853"; 
            }
            
            updateSubmitButtonState();
        };

        // Attach event listeners
        // Username: debounced
        usernameInput.addEventListener("input", debounce(() => {
            validateInput(usernameInput);
            updateUsernameCounter();
        }));
        usernameInput.addEventListener("blur", () => {
            usernameInput.value = usernameInput.value.trim();
            validateInput(usernameInput);
            updateUsernameCounter();
        });

        // Email: immediate validation (no debounce)
        emailInput.addEventListener("input", () => {
            validateInput(emailInput);
        });
        emailInput.addEventListener("blur", () => {
            emailInput.value = emailInput.value.trim();
            validateInput(emailInput);
        });

        // Password: debounced
        password.addEventListener("input", debounce(() => {
            validateInput(password);
            if (confirm.value) validateInput(confirm);
            updateSubmitButtonState();
        }));
        password.addEventListener("blur", () => {
            validateInput(password);
        });

        // Confirm password: immediate (to show match as you type)
        confirm.addEventListener("input", () => {
            validateInput(confirm);
            updateSubmitButtonState();
        });
        confirm.addEventListener("blur", () => {
            validateInput(confirm);
        });

        // Password toggle buttons
        const setupPasswordToggles = () => {
            const passwordInputs = registerForm.querySelectorAll("input[type='password']");
            passwordInputs.forEach(input => {
                const toggleBtn = document.createElement("button");
                toggleBtn.type = "button"; 
                toggleBtn.textContent = "Show";
                toggleBtn.style.marginLeft = "5px";
                toggleBtn.style.padding = "2px 6px";
                toggleBtn.style.cursor = "pointer";
                toggleBtn.style.fontSize = "0.8rem";
                toggleBtn.style.verticalAlign = "middle"; 
                toggleBtn.setAttribute("aria-label", "Show password"); 
                input.insertAdjacentElement("afterend", toggleBtn);
                toggleBtn.addEventListener("click", () => {
                    const isPassword = input.type === "password";
                    input.type = isPassword ? "text" : "password";
                    toggleBtn.textContent = isPassword ? "Hide" : "Show";
                });
            });
        };

        // Password strength – text only, consistent special char check
        const setupPasswordStrength = () => {
            if (!password) return;

            const strengthText = document.createElement("span");
            strengthText.className = "password-strength-indicator";
            strengthText.style.fontSize = "0.85rem";
            strengthText.style.fontWeight = "bold";
            strengthText.style.marginLeft = "10px";
            strengthText.style.verticalAlign = "middle";
            strengthText.setAttribute("aria-live", "polite");
            
            password.parentElement.appendChild(strengthText);

            const updateStrength = (val) => {
                const hasSpecial = /[^A-Za-z0-9]/.test(val);
                let strength = 0;
                if (val.length >= 8) strength += 1;
                if (/[A-Z]/.test(val)) strength += 1;
                if (/[a-z]/.test(val)) strength += 1;
                if (/[0-9]/.test(val)) strength += 1;
                if (hasSpecial) strength += 1;

                let text = "";
                let color = "";
                switch (strength) {
                    case 0: case 1: case 2:
                        text = "Weak 🔴";
                        color = "#d93025";
                        break;
                    case 3: case 4:
                        text = "Medium 🟡";
                        color = "#f4b400";
                        break;
                    case 5:
                        text = "Strong 🟢";
                        color = "#34a853";
                        break;
                }
                if (val.length === 0) text = "";
                strengthText.textContent = text;
                strengthText.style.color = color;
            };

            password.addEventListener("input", () => {
                updateStrength(password.value);
                updateSubmitButtonState();
            });
            updateStrength(password.value);
        };

        setupPasswordToggles();
        setupPasswordStrength();

        // Initial counter and button state
        updateUsernameCounter();
        updateSubmitButtonState();

        // Form submission (unchanged)
        let isSubmitting = false;
        let submissionAttempts = 0;

        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (isSubmitting) return;
            clearFormError();

            // Force validate all fields
            validateInput(usernameInput);
            validateInput(emailInput);
            validateInput(password);
            validateInput(confirm);
            updateSubmitButtonState();

            const isFormValid = submitBtn.disabled === false;
            if (!isFormValid) {
                displayFormError("Please fix the highlighted errors before submitting.");
                return;
            }

            submissionAttempts++;
            if (submissionAttempts > 5) {
                displayFormError("Too many attempts. Please try again later.");
                return;
            }

            isSubmitting = true;
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = "Processing...";
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.7";
            submitBtn.style.cursor = "wait";

            try {
                await new Promise(resolve => setTimeout(resolve, 1500));
                submitBtn.textContent = "Success! Redirecting...";
                submitBtn.style.backgroundColor = "#34a853"; 
                submitBtn.style.color = "white";
                setTimeout(() => window.location.href = "login.html", 1000);
            } catch (error) {
                console.error("Submission Error:", error);
                displayFormError("Registration failed. Please try again.");
                isSubmitting = false;
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
                submitBtn.style.opacity = "1";
                submitBtn.style.cursor = "pointer";
                updateSubmitButtonState();
            }
        });

        function displayFormError(message) {
            let formError = document.getElementById("main-form-error");
            if (!formError) {
                formError = document.createElement("div");
                formError.id = "main-form-error";
                formError.style.color = "#d93025";
                formError.style.marginBottom = "15px";
                formError.style.fontWeight = "bold";
                formError.style.textAlign = "center";
                formError.setAttribute("role", "alert");
                registerForm.insertBefore(formError, registerForm.firstChild);
            }
            formError.textContent = message;
        }

        function clearFormError() {
            const formError = document.getElementById("main-form-error");
            if (formError) formError.remove();
        }
    }

    // ==========================================
    // LOGIN FORM LOGIC (same as before)
    // ==========================================
    if (loginForm) {
        const loginBtn = loginForm.querySelector("button[type='submit']");
        const identifierInput = document.getElementById("login_identifier");
        const passwordInput = document.getElementById("password");
        
        let isLoggingIn = false;
        let loginAttempts = 0;

        if (identifierInput) identifierInput.focus();

        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (isLoggingIn) return;

            if (!identifierInput.value.trim() || !passwordInput.value.trim()) {
                displayLoginError("Please fill in both fields.");
                return;
            }

            loginAttempts++;
            if (loginAttempts > 5) {
                displayLoginError("Too many failed attempts. Please try again later.");
                loginBtn.disabled = true;
                loginBtn.style.opacity = "0.5";
                loginBtn.style.cursor = "not-allowed";
                return;
            }

            isLoggingIn = true;
            const originalBtnText = loginBtn.textContent;
            loginBtn.textContent = "Authenticating...";
            loginBtn.disabled = true;
            loginBtn.style.cursor = "wait";
            clearLoginError();

            try {
                await new Promise(resolve => setTimeout(resolve, 1200));
                loginBtn.textContent = "Welcome back!";
                loginBtn.style.backgroundColor = "#34a853";
                loginBtn.style.color = "white";

                const userRoleSelect = document.getElementById("userRole");
                const role = userRoleSelect ? userRoleSelect.value : "student";
                
                let targetPage = "student-home.html";
                if (role === "owner") {
                    targetPage = "owner-dashbroad.html";
                } else if (role === "admin") {
                    targetPage = "admin-dashboard.html";
                }
                
                setTimeout(() => window.location.href = targetPage, 1000);
            } catch (error) {
                console.error("Login attempt failed."); 
                displayLoginError("Invalid email/username or password.");
                isLoggingIn = false;
                loginBtn.textContent = originalBtnText;
                loginBtn.disabled = false;
                loginBtn.style.cursor = "pointer";
                passwordInput.value = "";
                passwordInput.focus();
            }
        });

        function displayLoginError(message) {
            let formError = document.getElementById("login-error");
            if (!formError) {
                formError = document.createElement("div");
                formError.id = "login-error";
                formError.style.color = "#d93025";
                formError.style.marginBottom = "15px";
                formError.style.fontWeight = "bold";
                formError.style.textAlign = "center";
                formError.setAttribute("role", "alert");
                loginForm.insertBefore(formError, loginForm.firstChild);
            }
            formError.textContent = message;
        }

        function clearLoginError() {
            const formError = document.getElementById("login-error");
            if (formError) formError.remove();
        }
    }
});
