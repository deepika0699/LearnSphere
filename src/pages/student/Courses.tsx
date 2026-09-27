/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  SlidersHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  Layers 
} from 'lucide-react';

// Reusable Components
import { SearchInput } from '../../components/SearchInput';
import { FilterDropdown, FilterOption } from '../../components/FilterDropdown';
import { SortDropdown, SortOption } from '../../components/SortDropdown';
import { ResetFiltersButton } from '../../components/ResetFiltersButton';
import { ViewToggle } from '../../components/ViewToggle';
import { EmptyState } from '../../components/EmptyState';
import { CourseCard } from '../../components/CourseCard';
import { SkeletonCard } from '../../components/SkeletonCard';
import { FeedbackState } from '../../components/FeedbackState';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { courseApi, PublicCourse } from '../../services/api';

const DEFAULT_CATEGORIES = [
  'Development',
  'Design',
  'Business',
  'Marketing',
  'Data Science',
  'Security',
  'Cloud Computing',
];

export const Courses: React.FC = () => {
  useDocumentTitle('Public Course Catalog');
  const navigate = useNavigate();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title_asc' | 'title_desc'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Data & Pagination states
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCourses, setTotalCourses] = useState<number>(0);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page to 1 whenever search, category, or sorting changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, sortBy]);

  // Fetch published courses from real backend API with race-condition & unmount protection
  useEffect(() => {
    let isSubscribed = true;

    const executeFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await courseApi.getCourses({
          page,
          limit: 12,
          category: selectedCategory || undefined,
          search: debouncedSearch || undefined,
          sort: sortBy,
        });

        if (!isSubscribed) return;

        setCourses(response.courses || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalCourses(response.pagination?.total || 0);
      } catch (err: any) {
        if (!isSubscribed) return;
        console.error('Failed to load published courses:', err);
        setError(
          err?.message || 'Unable to load course catalog. Please check your connection and try again.'
        );
        setCourses([]);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    executeFetch();

    return () => {
      isSubscribed = false;
    };
  }, [page, selectedCategory, debouncedSearch, sortBy, retryTrigger]);

  const handleRetry = useCallback(() => {
    setRetryTrigger((prev) => prev + 1);
  }, []);

  // Compute category options dynamically, combining defaults with any custom course categories
  const categoryOptions: FilterOption[] = useMemo(() => {
    const categorySet = new Set<string>(DEFAULT_CATEGORIES);
    courses.forEach((c) => {
      if (c.category) {
        categorySet.add(c.category);
      }
    });
    return Array.from(categorySet).map((cat) => ({
      value: cat,
      label: cat,
    }));
  }, [courses]);

  const difficultyOptions: FilterOption[] = [];

  const sortOptions: SortOption[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title_asc', label: 'Title (A-Z)' },
    { value: 'title_desc', label: 'Title (Z-A)' },
  ];

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSelectedDifficulty('');
    setSortBy('newest');
    setPage(1);
  };

  const isFiltersActive = 
    searchQuery !== '' || 
    selectedCategory !== '' || 
    selectedDifficulty !== '' || 
    sortBy !== 'newest';

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8" aria-label="Course Catalog">
      {/* 1. Page Title & Short Description Header */}
      <header className="border-b border-slate-200 pb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Public Course Catalog
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-500 max-w-2xl leading-relaxed">
          Browse our structured academic curricula and verify your technical competencies with self-paced learning resources.
        </p>
      </header>

      {/* Main Two-Column Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Filter Section & Search Bar */}
        <aside className="lg:col-span-1 space-y-6" aria-label="Filters and Search">
          
          {/* Search Bar Container */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search skills, topics, stack..."
              label="Search Catalog"
              id="catalog-search"
            />
          </section>

          {/* Filter Section */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>Filters</span>
              </h2>
            </div>

            {/* Category Filter */}
            <div className="space-y-1">
              <FilterDropdown
                label="Categories"
                options={categoryOptions}
                selectedValue={selectedCategory}
                onChange={setSelectedCategory}
                placeholder="All Categories"
                id="category-filter"
              />
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-1 pt-2">
              <FilterDropdown
                label="Difficulty Levels"
                options={difficultyOptions}
                selectedValue={selectedDifficulty}
                onChange={setSelectedDifficulty}
                placeholder="All Difficulty Levels"
                id="difficulty-filter"
              />
            </div>

            {/* Reset Filters Button */}
            <div className="pt-2">
              <ResetFiltersButton
                onReset={handleResetFilters}
                isDisabled={!isFiltersActive}
              />
            </div>
          </section>
        </aside>

        {/* Right Column: Results & Course Container */}
        <section className="lg:col-span-3 space-y-6" aria-label="Catalog Results">
          
          {/* Controls Panel (Sort, View Toggle, Results Summary) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white px-5 py-3 border border-slate-200 rounded-xl shadow-2xs">
            
            {/* Results Summary */}
            <div className="flex items-center space-x-2">
              <span className={`inline-block w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : totalCourses > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider">
                {loading ? 'Searching courses...' : `${totalCourses} ${totalCourses === 1 ? 'result' : 'results'} found`}
              </span>
            </div>

            {/* Sort Dropdown & View Toggle */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              {/* Sort Dropdown */}
              <SortDropdown
                options={sortOptions}
                selectedValue={sortBy}
                onChange={(val) => setSortBy(val as 'newest' | 'oldest' | 'title_asc' | 'title_desc')}
                id="catalog-sort"
                label="Sort by"
              />

              {/* View Toggle */}
              <ViewToggle
                viewMode={viewMode}
                onChange={setViewMode}
              />
            </div>

          </div>

          {/* Course Container */}
          <div 
            id="catalog-course-list"
            className={`transition-all duration-300 ${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 gap-6' 
                : 'flex flex-col gap-4'
            }`}
          >
            {/* 1. Loading State */}
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={`skeleton-${index}`} viewMode={viewMode} />
              ))
            ) : error ? (
              /* 2. Error State */
              <div className="col-span-full py-8">
                <FeedbackState
                  title="Failed to load course catalog"
                  message={error}
                  onRetry={handleRetry}
                  retryLabel="Retry Connection"
                />
              </div>
            ) : courses.length === 0 ? (
              /* 3. Empty State */
              <div className="col-span-full">
                <EmptyState
                  icon={Layers}
                  title={isFiltersActive ? "No matching courses found" : "No courses available"}
                  description={
                    isFiltersActive
                      ? "No published courses match your current search and filter criteria. Try adjusting your search term or resetting filters."
                      : "The course catalog is currently empty. Please check back later as new self-learning modules and academic tracks are published."
                  }
                />
              </div>
            ) : (
              /* 4. Loaded Course Cards */
              courses.map((course) => (
                <CourseCard
                  key={course.id}
                  thumbnail={course.thumbnail}
                  title={course.title}
                  shortDescription={course.description}
                  category={course.category}
                  difficulty={`${course.moduleCount} ${course.moduleCount === 1 ? 'Module' : 'Modules'}`}
                  duration={`${course.topicCount} ${course.topicCount === 1 ? 'Topic' : 'Topics'}`}
                  courseCreatorName={course.courseCreator?.name || 'Academic Creator'}
                  status={course.status}
                  viewMode={viewMode}
                  onActionClick={() => navigate(`/courses/${course.id}`)}
                  actionLabel="View Details"
                />
              ))
            )}
          </div>

          {/* Pagination Navigation */}
          <nav 
            id="catalog-pagination"
            className="flex items-center justify-between border-t border-slate-200 pt-5 mt-6" 
            aria-label="Pagination Navigation"
          >
            <div className="hidden sm:block">
              <p className="text-xs text-slate-500 font-mono">
                Page <span className="font-bold text-slate-800">{totalCourses > 0 ? page : 0}</span> of{' '}
                <span className="font-bold text-slate-800">{totalCourses > 0 ? totalPages : 0}</span>
              </p>
            </div>
            <div className="flex flex-1 justify-between sm:justify-end gap-3">
              <button
                id="catalog-prev-page"
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || loading || totalCourses === 0}
                className={`inline-flex items-center space-x-1 px-3 py-2 border rounded-lg text-xs font-semibold transition-all ${
                  page <= 1 || loading || totalCourses === 0
                    ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-2xs cursor-pointer'
                }`}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Previous</span>
              </button>
              <button
                id="catalog-next-page"
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || loading || totalCourses === 0}
                className={`inline-flex items-center space-x-1 px-3 py-2 border rounded-lg text-xs font-semibold transition-all ${
                  page >= totalPages || loading || totalCourses === 0
                    ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-2xs cursor-pointer'
                }`}
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </nav>

        </section>

      </div>
    </main>
  );
};

