import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { ScheduleApi } from '../hooks/useSchedule'
import { COLOR_PALETTE, DAY_NAMES, type Course, type LessonWithCourse } from '../lib/types'

type CoursesPanelProps = {
  api: ScheduleApi
}

type CourseFormState = {
  name: string
  year: string
  academic_year: string
  color: string
}

type LessonFormState = {
  course_id: string
  day_of_week: number
  start_time: string
  end_time: string
  room: string
  professor: string
  lesson_type: string
}

const emptyCourse = (): CourseFormState => ({
  name: '',
  year: '',
  academic_year: '',
  color: COLOR_PALETTE[0],
})

const emptyLesson = (courseId = ''): LessonFormState => ({
  course_id: courseId,
  day_of_week: 0,
  start_time: '09:00',
  end_time: '11:00',
  room: '',
  professor: '',
  lesson_type: 'Lezione',
})

export function CoursesPanel({ api }: CoursesPanelProps) {
  const { courses, lessons, addCourse, updateCourse, deleteCourse, addLesson, updateLesson, deleteLesson } =
    api

  const [courseForm, setCourseForm] = useState<CourseFormState | null>(null)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [lessonForm, setLessonForm] = useState<LessonFormState | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const openNewCourse = () => {
    setEditingCourseId(null)
    setCourseForm(emptyCourse())
    setFormError(null)
  }

  const openEditCourse = (course: Course) => {
    setEditingCourseId(course.id)
    setCourseForm({
      name: course.name,
      year: course.year?.toString() ?? '',
      academic_year: course.academic_year ?? '',
      color: course.color,
    })
    setFormError(null)
  }

  const openNewLesson = (courseId?: string) => {
    setEditingLessonId(null)
    setLessonForm(emptyLesson(courseId || courses[0]?.id || ''))
    setFormError(null)
  }

  const openEditLesson = (lesson: LessonWithCourse) => {
    setEditingLessonId(lesson.id)
    setLessonForm({
      course_id: lesson.course_id,
      day_of_week: lesson.day_of_week,
      start_time: lesson.start_time.slice(0, 5),
      end_time: lesson.end_time.slice(0, 5),
      room: lesson.room ?? '',
      professor: lesson.professor ?? '',
      lesson_type: lesson.lesson_type,
    })
    setFormError(null)
  }

  const submitCourse = async () => {
    if (!courseForm?.name.trim()) {
      setFormError('Inserisci il nome del corso')
      return
    }
    setBusy(true)
    setFormError(null)
    try {
      const payload = {
        name: courseForm.name.trim(),
        year: courseForm.year ? Number(courseForm.year) : null,
        academic_year: courseForm.academic_year.trim() || null,
        color: courseForm.color,
      }
      if (editingCourseId) {
        await updateCourse(editingCourseId, payload)
      } else {
        await addCourse(payload)
      }
      setCourseForm(null)
      setEditingCourseId(null)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Errore salvataggio corso')
    } finally {
      setBusy(false)
    }
  }

  const submitLesson = async () => {
    if (!lessonForm?.course_id) {
      setFormError('Seleziona un corso')
      return
    }
    if (lessonForm.end_time <= lessonForm.start_time) {
      setFormError("L'orario di fine deve essere dopo l'inizio")
      return
    }
    setBusy(true)
    setFormError(null)
    try {
      const payload = {
        course_id: lessonForm.course_id,
        day_of_week: lessonForm.day_of_week,
        start_time: `${lessonForm.start_time}:00`,
        end_time: `${lessonForm.end_time}:00`,
        room: lessonForm.room.trim() || null,
        professor: lessonForm.professor.trim() || null,
        lesson_type: lessonForm.lesson_type.trim() || 'Lezione',
      }
      if (editingLessonId) {
        await updateLesson(editingLessonId, payload)
      } else {
        await addLesson(payload)
      }
      setLessonForm(null)
      setEditingLessonId(null)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Errore salvataggio lezione')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="animate-rise space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-navy">
            I tuoi corsi
          </h2>
          <p className="text-sm text-muted">Gestisci materie e slot settimanali.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openNewCourse}
            className="inline-flex items-center gap-1.5 rounded-full bg-royal px-4 py-2.5 text-sm font-semibold text-white hover:bg-royal-soft transition"
          >
            <Plus className="size-4" />
            Corso
          </button>
          <button
            type="button"
            onClick={() => openNewLesson()}
            disabled={courses.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(26,42,92,0.2)] bg-white px-4 py-2.5 text-sm font-semibold text-navy disabled:opacity-40 hover:border-royal hover:text-royal transition"
          >
            <Plus className="size-4" />
            Lezione
          </button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[rgba(26,42,92,0.2)] bg-white/70 p-8 text-center">
          <p className="font-display text-lg font-extrabold text-navy">Nessun corso ancora</p>
          <p className="mt-1 text-sm text-muted">
            Crea il primo corso per iniziare a costruire l&apos;orario.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {courses.map((course) => {
            const courseLessons = lessons.filter((l) => l.course_id === course.id)
            return (
              <li
                key={course.id}
                className="rounded-3xl border border-[rgba(26,42,92,0.08)] bg-white/85 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className="mt-1 size-3.5 shrink-0 rounded-full"
                      style={{ background: course.color }}
                    />
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-extrabold text-navy truncate">
                        {course.name}
                      </h3>
                      <p className="text-xs text-muted">
                        {[
                          course.year ? `${course.year}° anno` : null,
                          course.academic_year,
                          `${courseLessons.length} slot`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEditCourse(course)}
                      className="rounded-xl p-2 text-muted hover:bg-paper-2 hover:text-navy"
                      aria-label="Modifica corso"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteCourse(course.id)}
                      className="rounded-xl p-2 text-muted hover:bg-red-50 hover:text-red-600"
                      aria-label="Elimina corso"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {courseLessons.length > 0 && (
                  <ul className="mt-3 space-y-2 border-t border-[rgba(26,42,92,0.06)] pt-3">
                    {courseLessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-paper/80 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-navy">
                            {DAY_NAMES[lesson.day_of_week]}{' '}
                            <span className="tabular-nums text-muted font-normal">
                              {lesson.start_time.slice(0, 5)}–{lesson.end_time.slice(0, 5)}
                            </span>
                          </p>
                          <p className="truncate text-xs text-muted">
                            {[lesson.lesson_type, lesson.room, lesson.professor]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => openEditLesson(lesson)}
                            className="rounded-lg p-1.5 text-muted hover:bg-white hover:text-navy"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteLesson(lesson.id)}
                            className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  onClick={() => openNewLesson(course.id)}
                  className="mt-3 text-sm font-semibold text-royal hover:text-royal-soft"
                >
                  + Aggiungi slot
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {courseForm && (
        <Modal
          title={editingCourseId ? 'Modifica corso' : 'Nuovo corso'}
          onClose={() => setCourseForm(null)}
        >
          <Field label="Nome">
            <input
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              className="field-input"
              placeholder="Analisi Matematica I"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Anno">
              <input
                type="number"
                min={1}
                max={6}
                value={courseForm.year}
                onChange={(e) => setCourseForm({ ...courseForm, year: e.target.value })}
                className="field-input"
                placeholder="1"
              />
            </Field>
            <Field label="A.A.">
              <input
                value={courseForm.academic_year}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, academic_year: e.target.value })
                }
                className="field-input"
                placeholder="2025/2026"
              />
            </Field>
          </div>
          <Field label="Colore">
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCourseForm({ ...courseForm, color: c })}
                  className={`size-8 rounded-full border-2 transition ${
                    courseForm.color === c ? 'border-navy scale-110' : 'border-transparent'
                  }`}
                  style={{ background: c }}
                  aria-label={`Colore ${c}`}
                />
              ))}
            </div>
          </Field>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCourseForm(null)}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-muted"
            >
              Annulla
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submitCourse()}
              className="rounded-full bg-royal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              Salva
            </button>
          </div>
        </Modal>
      )}

      {lessonForm && (
        <Modal
          title={editingLessonId ? 'Modifica lezione' : 'Nuova lezione'}
          onClose={() => setLessonForm(null)}
        >
          <Field label="Corso">
            <select
              value={lessonForm.course_id}
              onChange={(e) => setLessonForm({ ...lessonForm, course_id: e.target.value })}
              className="field-input"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Giorno">
            <select
              value={lessonForm.day_of_week}
              onChange={(e) =>
                setLessonForm({ ...lessonForm, day_of_week: Number(e.target.value) })
              }
              className="field-input"
            >
              {DAY_NAMES.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inizio">
              <input
                type="time"
                value={lessonForm.start_time}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, start_time: e.target.value })
                }
                className="field-input"
              />
            </Field>
            <Field label="Fine">
              <input
                type="time"
                value={lessonForm.end_time}
                onChange={(e) => setLessonForm({ ...lessonForm, end_time: e.target.value })}
                className="field-input"
              />
            </Field>
          </div>
          <Field label="Tipo">
            <select
              value={lessonForm.lesson_type}
              onChange={(e) =>
                setLessonForm({ ...lessonForm, lesson_type: e.target.value })
              }
              className="field-input"
            >
              <option>Lezione</option>
              <option>Laboratorio</option>
              <option>Esercitazione</option>
              <option>Seminario</option>
            </select>
          </Field>
          <Field label="Aula">
            <input
              value={lessonForm.room}
              onChange={(e) => setLessonForm({ ...lessonForm, room: e.target.value })}
              className="field-input"
              placeholder="Aula Magna"
            />
          </Field>
          <Field label="Docente">
            <input
              value={lessonForm.professor}
              onChange={(e) =>
                setLessonForm({ ...lessonForm, professor: e.target.value })
              }
              className="field-input"
              placeholder="M. Rossi"
            />
          </Field>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setLessonForm(null)}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-muted"
            >
              Annulla
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submitLesson()}
              className="rounded-full bg-royal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              Salva
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        .field-input {
          width: 100%;
          border-radius: 0.9rem;
          border: 1.5px solid rgba(26, 42, 92, 0.12);
          background: #fff;
          padding: 0.7rem 0.9rem;
          color: #121a33;
          outline: none;
        }
        .field-input:focus {
          border-color: #2f7bff;
          box-shadow: 0 0 0 3px rgba(47, 123, 255, 0.15);
        }
      `}</style>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-navy/40 backdrop-blur-[2px]"
        aria-label="Chiudi"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl animate-rise space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-lg font-extrabold text-navy">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted hover:bg-paper-2"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
