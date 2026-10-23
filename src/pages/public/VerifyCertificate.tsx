/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useId } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Award,
  CheckCircle2,
  Calendar,
  User,
  BookOpen,
  Copy,
  Check,
  Search,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { publicCertificateApi } from '../../services/api';
import { PublicCertificateVerification } from '../../types';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const CERT_ID_REGEX = /^LS-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/i;

type VerificationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'invalid_format'; message: string }
  | { status: 'verified'; data: PublicCertificateVerification }
  | { status: 'revoked'; data: PublicCertificateVerification }
  | { status: 'not_found'; message: string }
  | { status: 'error'; message: string };

export const VerifyCertificate: React.FC = () => {
  useDocumentTitle('Verify Credential | LearnSphere');
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<VerificationState>({ status: 'idle' });
  const [searchInput, setSearchInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const searchInputId = useId();

  // Primary verification effect whenever route param changes
  useEffect(() => {
    if (!certificateId) {
      setState({
        status: 'invalid_format',
        message: 'No certificate identifier was provided in the URL.',
      });
      return;
    }

    const trimmedId = certificateId.trim().toUpperCase();
    setSearchInput(trimmedId);

    // Client-side format pre-validation (UX layer)
    if (!CERT_ID_REGEX.test(trimmedId)) {
      setState({
        status: 'invalid_format',
        message: `The certificate ID "${certificateId}" does not match the valid LearnSphere format (LS-XXXX-XXXX-XXXX).`,
      });
      return;
    }

    // Call authoritative backend verification endpoint
    let isMounted = true;
    setState({ status: 'loading' });

    publicCertificateApi
      .verifyCertificatePublic(trimmedId)
      .then((verification) => {
        if (!isMounted) return;
        if (verification.status === 'revoked') {
          setState({ status: 'revoked', data: verification });
        } else {
          setState({ status: 'verified', data: verification });
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        if (err?.statusCode === 404 || err?.status === 404) {
          setState({
            status: 'not_found',
            message: `No certificate matching ID "${trimmedId}" was found in LearnSphere's official credential registry.`,
          });
        } else if (err?.statusCode === 400 || err?.status === 400) {
          setState({
            status: 'invalid_format',
            message: err.message || 'Invalid certificate ID format.',
          });
        } else {
          setState({
            status: 'error',
            message: 'Unable to reach the verification service. Please verify your internet connection or try again.',
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [certificateId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim().toUpperCase();
    if (clean) {
      navigate(`/verify/${encodeURIComponent(clean)}`);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = () => {
    if (certificateId) {
      const clean = certificateId.trim().toUpperCase();
      navigate(`/verify/${encodeURIComponent(clean)}`, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Verification Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-50 text-emerald-700 rounded-2xl ring-1 ring-emerald-200 shadow-xs mb-2">
            <ShieldCheck className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Official Credential Verification
          </h1>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            LearnSphere public registry for verifying the authenticity and academic standing of student course completion certificates.
          </p>
        </div>

        {/* Search / Lookup Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white p-2.5 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row gap-2"
          role="search"
          aria-label="Certificate lookup"
        >
          <div className="relative flex-1">
            <label htmlFor={searchInputId} className="sr-only">
              Certificate Identifier
            </label>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id={searchInputId}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. LS-ABCD-1234-EF56"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all uppercase tracking-wide"
              spellCheck="false"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Verify</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>

        {/* Dynamic Verification Content */}
        <main aria-live="polite">
          {state.status === 'loading' && (
            <div
              className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4 shadow-xs"
              role="status"
            >
              <div className="inline-block animate-spin text-emerald-600">
                <RefreshCw className="w-8 h-8" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Verifying Credential...</h2>
              <p className="text-sm text-slate-500">
                Querying the official LearnSphere academic registry for record validity.
              </p>
            </div>
          )}

          {state.status === 'verified' && (
            <section
              className="bg-white rounded-2xl border-2 border-emerald-500 shadow-md overflow-hidden"
              aria-label="Verified Certificate Information"
            >
              {/* Verified Banner */}
              <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-100 shrink-0" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                      Registry Status
                    </div>
                    <div className="text-lg font-bold">Authentic & Valid Credential</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 rounded-lg text-xs font-medium text-white transition-colors cursor-pointer"
                  title="Copy direct verification link"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copied URL</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Share Verification</span>
                    </>
                  )}
                </button>
              </div>

              {/* Credential Details */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Certificate Identifier
                  </div>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-slate-900 tracking-wide">
                    {state.data.certificateId}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span>Issued To</span>
                    </div>
                    <div className="text-lg font-bold text-slate-900">
                      {state.data.studentName}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span>Completed Course</span>
                    </div>
                    <div className="text-lg font-bold text-slate-900">
                      {state.data.courseTitle}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span>Date Completed</span>
                    </div>
                    <div className="text-sm font-medium text-slate-700">
                      {state.data.completedAt
                        ? new Date(state.data.completedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Official Record Verified'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <Award className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span>Date Issued</span>
                    </div>
                    <div className="text-sm font-medium text-slate-700">
                      {state.data.issueDate
                        ? new Date(state.data.issueDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Official Record Verified'}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-900">Authoritative Platform Record:</span>
                    <p>
                      This credential certifies that the student completed all required syllabus topics and successfully passed all course assessment requirements in LearnSphere.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {state.status === 'revoked' && (
            <section
              className="bg-white rounded-2xl border-2 border-rose-500 shadow-md overflow-hidden"
              aria-label="Revoked Certificate Information"
            >
              {/* Revoked Banner */}
              <div className="bg-rose-600 px-6 py-4 text-white flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6 text-rose-100 shrink-0" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-rose-100">
                      Registry Status
                    </div>
                    <div className="text-lg font-bold">Credential Officially Revoked</div>
                  </div>
                </div>
                <div className="inline-block px-2.5 py-1 bg-rose-700 text-rose-100 text-xs font-mono font-bold rounded-md">
                  INVALID
                </div>
              </div>

              {/* Historical Snapshot with Revocation Notice */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800">
                  <p className="font-semibold">Notice of Administrative Revocation</p>
                  <p className="mt-1 text-rose-700">
                    This certificate record exists in the historical registry but has been designated as <strong className="font-bold">revoked</strong> by academic administration. It does not confer active credential status.
                  </p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Historical Identifier
                  </div>
                  <div className="font-mono text-xl font-bold text-slate-900 line-through">
                    {state.data.certificateId}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-slate-600">
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Originally Issued To
                    </div>
                    <div className="text-base font-semibold text-slate-800 mt-0.5">
                      {state.data.studentName}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Course Subject
                    </div>
                    <div className="text-base font-semibold text-slate-800 mt-0.5">
                      {state.data.courseTitle}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {state.status === 'not_found' && (
            <div
              className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 text-center space-y-4 shadow-xs"
              role="alert"
            >
              <div className="inline-flex p-3 bg-amber-50 text-amber-600 rounded-2xl ring-1 ring-amber-200 mb-1">
                <AlertTriangle className="w-8 h-8" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Certificate Not Found</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">{state.message}</p>
              <div className="pt-2 text-xs text-slate-400">
                Verify the spelling of the certificate ID or ask the credential holder to share their verified link directly.
              </div>
            </div>
          )}

          {state.status === 'invalid_format' && (
            <div
              className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 text-center space-y-4 shadow-xs"
              role="alert"
            >
              <div className="inline-flex p-3 bg-slate-100 text-slate-600 rounded-2xl ring-1 ring-slate-200 mb-1">
                <AlertTriangle className="w-8 h-8" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Invalid Identifier Format</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">{state.message}</p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 inline-block font-mono text-xs text-slate-700">
                Expected: LS-XXXX-XXXX-XXXX
              </div>
            </div>
          )}

          {state.status === 'error' && (
            <div
              className="bg-white rounded-2xl p-8 sm:p-12 border border-rose-200 text-center space-y-4 shadow-xs"
              role="alert"
            >
              <div className="inline-flex p-3 bg-rose-50 text-rose-600 rounded-2xl ring-1 ring-rose-200 mb-1">
                <AlertTriangle className="w-8 h-8" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Service Temporarily Unavailable</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">{state.message}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span>Retry Verification</span>
              </button>
            </div>
          )}
        </main>

        {/* Footer Navigation */}
        <div className="text-center pt-4 border-t border-slate-200/80">
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <span>Explore LearnSphere Courses</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificate;
