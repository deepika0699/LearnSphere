/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const Contact: React.FC = () => {
  useDocumentTitle('Contact Us');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && message) {
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header section */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border border-primary-100"
          >
            <Mail className="w-3.5 h-3.5 text-primary-600" />
            <span>Get In Touch</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl font-bold text-slate-900 tracking-tight"
          >
            Contact Our Team
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-500 text-md sm:text-lg max-w-2xl mx-auto font-sans leading-relaxed"
          >
            Have questions about our curricula or certificates? Drop us a message below and we will respond as soon as possible.
          </motion.p>
        </div>

        {/* Contact details & Form layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* Details Column */}
          <div className="md:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg text-slate-900">Information</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Our support team is available Monday through Friday from 9:00 AM to 5:00 PM.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                  <Mail className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Email Address</span>
                  <span className="text-xs font-semibold text-slate-800">support@learnsphere.edu</span>
                </div>
              </div>

              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                  <Phone className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Phone Support</span>
                  <span className="text-xs font-semibold text-slate-800">+1 (800) 555-0199</span>
                </div>
              </div>

              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                  <MapPin className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Office Campus</span>
                  <span className="text-xs font-semibold text-slate-800">San Francisco, CA</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <span className="text-[9px] font-mono text-slate-400">Average response time: &lt; 24 Hours</span>
            </div>
          </div>

          {/* Form Column */}
          <div className="md:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-display font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">Send a Message</h3>
              
              {submitted && (
                <div className="p-3.5 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700 font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Your inquiry has been submitted successfully!</span>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Jane Doe"
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="jane.doe@example.com"
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Message Body
                </label>
                <textarea
                  id="message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="Tell us what you would like to ask..."
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
