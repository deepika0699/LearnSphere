/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import { Award, Copy, Check, Printer, Eye, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmptyState } from '../../components/EmptyState';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const Certificates: React.FC = () => {
  useDocumentTitle('Academic Credentials');
  const { state } = useApp();
  const { certificates } = state;
  const navigate = useNavigate();
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeCertificate = certificates.find((c) => c.id === selectedCertificateId);

  const handleCopyLink = (credentialId: string) => {
    const fakeLink = `${window.location.origin}/verify/${credentialId}`;
    navigator.clipboard.writeText(fakeLink);
    setCopiedId(credentialId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
            Academic Credentials
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-xl">
            View, download, and share your earned professional certifications. LearnSphere credentials represent comprehensive subject mastery.
          </p>
        </div>
        
        {certificates.length > 0 && (
          <div className="mt-4 md:mt-0 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>{certificates.length} Verifiable Credentials Secured</span>
          </div>
        )}
      </div>

      {certificates.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={Award}
          title="No certificates earned yet"
          description="Complete your courses and pass their final quizzes to earn verifiable professional certificates."
          action={{
            label: 'Explore Courses',
            onClick: () => navigate('/courses'),
          }}
        />
      ) : (
        /* Certificate Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              {/* Premium Card Header with Badge */}
              <div className="p-6 bg-slate-900 text-white relative overflow-hidden h-32 flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full blur-2xl" />
                
                <div className="flex justify-between items-start">
                  <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-white font-display font-bold text-xs">
                    L
                  </div>
                  <span className="text-[9px] font-mono font-semibold bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30 uppercase">
                    Verifiable
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-semibold text-xs text-slate-400 uppercase tracking-wider">
                    COURSE CERTIFICATION
                  </h3>
                  <span className="text-[10px] font-mono text-slate-300">ID: {cert.credentialId}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                <h4 className="font-display font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                  {cert.courseTitle}
                </h4>

                <div className="space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3.5">
                  <div className="flex justify-between">
                    <span>Recipient:</span>
                    <span className="font-semibold text-slate-800">{cert.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Issue Date:</span>
                    <span className="font-semibold text-slate-800">{cert.issueDate}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleCopyLink(cert.credentialId)}
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors"
                  title="Copy verification link"
                >
                  {copiedId === cert.credentialId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setSelectedCertificateId(cert.id)}
                  className="inline-flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700 font-bold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Credentials</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full landscape visual model */}
      <AnimatePresence>
        {selectedCertificateId && activeCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-4xl w-full border border-slate-200 overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal control bar */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center print:hidden">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-semibold text-slate-800">Verifiable Academic Award</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Award</span>
                  </button>
                  <button
                    onClick={() => setSelectedCertificateId(null)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Landscape printable section */}
              <div className="p-8 sm:p-12 md:p-16 text-center space-y-8 relative overflow-hidden border-8 border-slate-100 m-4 rounded-xl flex-grow bg-white">
                {/* Visual Stamp */}
                <div className="absolute top-4 right-4 w-28 h-28 border border-amber-500/20 text-amber-500/25 rounded-full flex flex-col items-center justify-center font-mono text-[9px] uppercase tracking-widest font-bold rotate-12">
                  <Award className="w-8 h-8 opacity-40 mb-1" />
                  <span>LearnSphere</span>
                  <span>Verified</span>
                </div>

                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white font-display font-bold text-xl mx-auto shadow-xs">
                    L
                  </div>
                  <h3 className="font-display font-bold text-sm tracking-widest text-slate-400 uppercase">
                    LEARNSPHERE CERTIFICATION OF ACHIEVEMENT
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    This document certifies that the academic advisory council has awarded the credential of
                  </p>
                </div>

                <div className="space-y-2">
                  <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight underline decoration-primary-200 decoration-4 underline-offset-8">
                    {activeCertificate.studentName}
                  </h2>
                  <p className="text-xs text-slate-500 pt-2 font-medium max-w-md mx-auto">
                    for demonstrating complete analytical capability and passing all rigorous requirements of
                  </p>
                </div>

                <div className="space-y-2">
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-800">
                    {activeCertificate.courseTitle}
                  </h1>
                  <span className="text-xs font-mono font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full uppercase border border-primary-100">
                    SaaS Professional Program
                  </span>
                </div>

                {/* Signatures & serial details */}
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100 max-w-2xl mx-auto">
                  <div className="space-y-1">
                    <div className="font-mono text-sm italic text-slate-700">Adrian Holovaty</div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      CHIEF ACADEMIC OFFICER
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-mono text-xs text-slate-700 font-semibold">{activeCertificate.issueDate}</div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      DATE OF INITIATION
                    </div>
                  </div>
                </div>

                <div className="pt-4 text-center font-mono text-[10px] text-slate-400 border-t border-slate-100/50 max-w-sm mx-auto">
                  <span>CREDENTIAL ID: </span>
                  <span className="font-bold text-slate-600">{activeCertificate.credentialId}</span>
                  <span className="block text-[8px] text-slate-300">VERIFIABLE AT LEARNSPHERE.ORG/VERIFY</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
