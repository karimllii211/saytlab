document.addEventListener('DOMContentLoaded', () => {

  /* ===== Mobil menyu ===== */
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('main-nav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      mainNav.classList.toggle('is-open');
      menuToggle.classList.toggle('is-active');
    });
  }

  /* ===== Scroll reveal ===== */
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => io.observe(el));

  /* ===== Use-case accordion ===== */
  const ucItems = document.querySelectorAll('.usecase-item');
  ucItems.forEach(item => {
    item.addEventListener('click', () => {
      ucItems.forEach(i => i.classList.remove('is-active'));
      item.classList.add('is-active');
    });
  });

  /* ===== FAQ accordion ===== */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const q = item.querySelector('.faq-q');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      faqItems.forEach(i => i.classList.remove('is-open'));
      if (!isOpen) item.classList.add('is-open');
    });
  });

  /* ===== Testimonials carousel ===== */
  const track = document.getElementById('testimonialTrack');
  const prevBtn = document.getElementById('tPrev');
  const nextBtn = document.getElementById('tNext');
  if (track && prevBtn && nextBtn) {
    const scrollAmount = () => track.querySelector('.testimonial-card').offsetWidth + 16;
    nextBtn.addEventListener('click', () => track.scrollBy({ left: scrollAmount(), behavior: 'smooth' }));
    prevBtn.addEventListener('click', () => track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }));
  }

  /* ===== Pricing monthly/yearly toggle ===== */
  const billingSwitch = document.getElementById('billingSwitch');
  const labelMonthly = document.getElementById('labelMonthly');
  const labelYearly = document.getElementById('labelYearly');
  const amounts = document.querySelectorAll('.price .amount');

  function setBilling(isYearly) {
    billingSwitch.classList.toggle('is-yearly', isYearly);
    labelMonthly.classList.toggle('is-active', !isYearly);
    labelYearly.classList.toggle('is-active', isYearly);
    amounts.forEach(el => {
      const val = isYearly ? el.dataset.yearly : el.dataset.monthly;
      el.textContent = '₼' + val;
    });
  }

  if (billingSwitch) {
    billingSwitch.addEventListener('click', () => {
      setBilling(!billingSwitch.classList.contains('is-yearly'));
    });
  }

  /* ===== Header shadow on scroll ===== */
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 20 ? '0 8px 24px rgba(0,0,0,.35)' : 'none';
  });

});
