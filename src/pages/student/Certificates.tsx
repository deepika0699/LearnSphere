/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  Copy,
  Check,
  Printer,
  Eye,
  X,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  User,
  BookOpen,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { studentCertificateApi } from '../../services/api';
import { Certificate } from '../../types';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const Certificates: React.FC = () => {
  useDocumentTitle('Academic Credentials | LearnSphere');
  const { accessToken } = useApp();
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCertificates = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await studentCertificateApi.getStudentCertificates(accessToken);
      setCertificates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(
        err?.message || 'Unable to load academic certificates. Please check your connection.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleCopyVerificationLink = (certificateId: string) => {
    const verificationUrl = `${window.location.origin}/verify/${encodeURIComponent(certificateId)}`;
    navigator.clipboard
      .writeText(verificationUrl)
      .then(() => {
        setCopiedId(certificateId);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => {
        // Fallback or silent fail
      });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
            Academic Credentials
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-xl">
            Official verifiable certificates awarded upon completing course curriculum requirements and passing all academic assessments.
          </p>
        </div>

        {certificates.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>
              {certificates.length} Verifiable Credential{certificates.length === 1 ? '' : 's'} Earned
            </span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3" role="status">
          <LoadingSpinner size="lg" label="Loading certificates..." direction="col" />
          <p className="text-xs text-slate-400 font-medium">
            Retrieving official academic credentials from server registry...
          </p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div
          className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 max-w-lg mx-auto shadow-xs"
          role="alert"
        >
          <div className="inline-flex p-3 bg-rose-50 text-rose-600 rounded-2xl ring-1 ring-rose-200">
            <AlertCircle className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Unable to Load Credentials</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={fetchCertificates}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && certificates.length === 0 && (
        <EmptyState
          icon={Award}
          title="No Certificates Earned Yet"
          description="Complete all syllabus topics and pass all required assessments in an enrolled course to claim your official academic certificate."
          action={{
            label: 'Explore Courses',
            onClick: () => navigate('/courses'),
          }}
        />
      )}

      {/* Certificate Grid */}
      {!isLoading && !error && certificates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {certificates.map((cert) => {
            const isRevoked = cert.status === 'revoked';
            const displayId = cert.certificateId || cert.id;

            return (
              <div
                key={cert.id || cert.certificateId}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Header Banner */}
                <div
                  className={`p-6 text-white relative overflow-hidden h-32 flex flex-col justify-between ${
                    isRevoked ? 'bg-slate-800' : 'bg-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white font-display font-bold text-xs">
                      L
                    </div>
                    {isRevoked ? (
                      <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/30 uppercase flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-400" aria-hidden="true" />
                        <span>Revoked</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                        <span>Verifiable</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="font-display font-semibold text-[10px] text-slate-400 uppercase tracking-widest">
                      ACADEMIC CREDENTIAL
                    </h2>
                    <span className="text-[11px] font-mono text-slate-300 font-semibold tracking-wide">
                      {displayId}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  <h3 className="font-display font-bold text-base text-slate-900 leading-snug line-clamp-2">
                    {cert.courseTitle}
                  </h3>

                  <div className="space-y-2 text-xs text-slate-500 border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Recipient:</span>
                      <span className="font-semibold text-slate-800">{cert.studentName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Date Issued:</span>
                      <span className="font-semibold text-slate-800">
                        {cert.issueDate
                          ? new Date(cert.issueDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Official Record'}
                      </span>
                    </div>
                    {cert.completedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Completed:</span>
                        <span className="font-medium text-slate-700">
                          {new Date(cert.completedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyVerificationLink(displayId)}
                    className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
                    title="Copy public verification link"
                  >
                    {copiedId === displayId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                        <span className="text-emerald-700 font-bold">Copied URL</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        <span>Share Link</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-3">
                    <Link
                      to={`/verify/${encodeURIComponent(displayId)}`}
                      className="inline-flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-900 font-semibold transition-colors"
                      title="Open public verification page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Verify</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setSelectedCertificate(cert)}
                      className="inline-flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700 font-bold transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Credential Presentation Modal */}
      {selectedCertificate && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-cert-title"
        >
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 overflow-hidden shadow-2xl flex flex-col my-8">
            {/* Modal Control Bar */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center print:hidden">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-primary-600" aria-hidden="true" />
                <span id="modal-cert-title" className="text-sm font-bold text-slate-900">
                  Official Academic Credential
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Print</span>
                </button>
                <Link
                  to={`/verify/${encodeURIComponent(selectedCertificate.certificateId || selectedCertificate.id)}`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Public Registry</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedCertificate(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close credential view"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Credential Certificate View */}
            <div className="p-8 sm:p-12 md:p-16 text-center space-y-8 relative overflow-hidden border-8 border-slate-100 m-4 rounded-xl flex-grow bg-white">
              {/* Official Stamp */}
              <div className="absolute top-4 right-4 w-28 h-28 border border-emerald-500/20 text-emerald-600/30 rounded-full flex flex-col items-center justify-center font-mono text-[9px] uppercase tracking-widest font-bold rotate-12">
                <Award className="w-8 h-8 opacity-40 mb-1" aria-hidden="true" />
                <span>LearnSphere</span>
                <span>Verified</span>
              </div>

              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-display font-bold text-xl mx-auto shadow-xs">
                  L
                </div>
                <h3 className="font-display font-bold text-xs tracking-widest text-slate-400 uppercase">
                  LEARNSPHERE CERTIFICATION OF ACHIEVEMENT
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  This document certifies that the academic advisory council has awarded the credential to
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {selectedCertificate.studentName}
                </h2>
                <p className="text-xs text-slate-500 pt-2 font-medium max-w-md mx-auto">
                  for demonstrating analytical capability and successfully fulfilling all curriculum topics and assessment requirements of
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                  {selectedCertificate.courseTitle}
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase border border-emerald-200">
                  {selectedCertificate.status === 'revoked' ? 'Status: Revoked' : 'Verified Academic Credential'}
                </span>
              </div>

              {/* Serial and registry details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-slate-100 max-w-2xl mx-auto">
                <div className="space-y-1">
                  <div className="font-mono text-xs font-semibold text-slate-800">
                    {selectedCertificate.issueDate
                      ? new Date(selectedCertificate.issueDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Verified'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    DATE OF ISSUANCE
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-mono text-xs font-semibold text-slate-800">
                    {selectedCertificate.completedAt
                      ? new Date(selectedCertificate.completedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Official Record'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    DATE OF COURSE COMPLETION
                  </div>
                </div>
              </div>

              <div className="pt-4 text-center font-mono text-[10px] text-slate-400 border-t border-slate-100 max-w-sm mx-auto space-y-1">
                <div>
                  <span>CREDENTIAL ID: </span>
                  <span className="font-bold text-slate-700">
                    {selectedCertificate.certificateId || selectedCertificate.id}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400">
                  PUBLIC REGISTRY: {window.location.origin}/verify/{selectedCertificate.certificateId || selectedCertificate.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
