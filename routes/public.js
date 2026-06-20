'use strict';
const express = require('express');
const router = express.Router();
const store = require('../services/store');
const config = require('../config/config');

router.get('/', (req, res) => {
  res.render('home', {
    title: config.company.name + ' — Laboratory & High-Pressure Equipment Manufacturer',
    metaDesc: 'D Cam Engineering — manufacturer of laboratory equipment, high pressure syringe pumps, core holders, core flooding apparatus & testing equipment from Ahmedabad, India.',
    categories: store.categories(),
    products: store.allActiveProducts(),
    testimonials: store.testimonials().slice(0, 3),
  });
});

router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us | ' + config.company.name,
    metaDesc: 'D Cam Engineering — manufacturer of Hassler core holders, high pressure syringe pumps, core flooding apparatus and laboratory equipment from Ahmedabad since 2011.',
  });
});

router.get('/products', (req, res) => {
  const categories = store.categories().map(c => ({ ...c, products: store.productsByCategory(c.id) }));
  res.render('products', {
    title: 'Our Products | ' + config.company.name,
    metaDesc: 'Browse core holders, accumulators, high pressure syringe pumps, core flooding apparatus, permeameters and reactors manufactured by D Cam Engineering, Ahmedabad.',
    categories,
  });
});

router.get('/products/:categorySlug', (req, res, next) => {
  const cat = store.categoryBySlug(req.params.categorySlug);
  if (!cat) return next();
  const products = store.productsByCategory(cat.id);
  res.render('category', {
    title: cat.name + ' | ' + config.company.name,
    metaDesc: cat.description,
    category: cat, products,
  });
});

router.get('/products/:categorySlug/:productSlug', (req, res, next) => {
  const product = store.productBySlug(req.params.productSlug);
  if (!product) return next();
  const cat = store.categoryBySlug(req.params.categorySlug);
  const related = store.productsByCategory(product.category_id).filter(p => p.id !== product.id);
  res.render('product', {
    title: product.seo_title || (product.name + ' | ' + config.company.name),
    metaDesc: product.seo_meta || product.short_desc,
    product, category: cat, related,
  });
});

router.get('/testimonials', (req, res) => {
  const list = store.testimonials();
  const avg = list.length ? (list.reduce((s, t) => s + (t.rating || 0), 0) / list.length) : 0;
  res.render('testimonials', {
    title: 'Testimonials | ' + config.company.name,
    metaDesc: 'Ratings and reviews for D Cam Engineering, Ahmedabad — including international customers.',
    testimonials: list, avg: avg.toFixed(1),
  });
});

router.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact Us | ' + config.company.name,
    metaDesc: 'Contact D Cam Engineering, Ahmedabad, Gujarat — manufacturer of laboratory equipment and high pressure pumps. Request a quote or callback.',
    product: null,
  });
});

router.get('/thank-you', (req, res) => {
  res.render('thank-you', {
    title: 'Thank you | ' + config.company.name, metaDesc: '',
    ref: req.query.ref || '', noindex: true,
  });
});

router.get('/privacy', (req, res) => res.render('legal', { title: 'Privacy Policy | ' + config.company.name, metaDesc: '', kind: 'privacy' }));
router.get('/terms', (req, res) => res.render('legal', { title: 'Terms | ' + config.company.name, metaDesc: '', kind: 'terms' }));

module.exports = router;
