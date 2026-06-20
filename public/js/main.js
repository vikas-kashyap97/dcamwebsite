// Mobile nav
document.addEventListener('click', function (e) {
  if (e.target.closest('.nav-toggle')) {
    document.querySelector('.nav')?.classList.toggle('open');
  }
});

// Product gallery
function dcamSwapImage(el) {
  var main = document.getElementById('galleryMain');
  if (main) main.src = el.dataset.full || el.src;
  document.querySelectorAll('.gallery .thumbs img').forEach(function (t) { t.classList.remove('active'); });
  el.classList.add('active');
}

// Scroll to enquiry form
function dcamScrollToForm() {
  var f = document.getElementById('enquiry');
  if (f) f.scrollIntoView({ behavior: 'smooth' });
}

// Build WhatsApp prefilled link on product pages
function dcamWhatsApp(number, text) {
  window.open('https://wa.me/' + number + '?text=' + encodeURIComponent(text), '_blank');
}
