"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitGraduate, type SubmitResult } from "@/lib/actions";
import { fetchDepartments, fetchProgrammes, type School, type Department } from "@/lib/must-queries";
import {
  KENYAN_COUNTIES,
  EMPLOYMENT_SECTORS,
  GRADUATION_YEARS,
  GRADUATE_SKILLS,
} from "@/lib/must-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/* ── Zod schema ─────────────────────────────────────── */
const schema = z
  .object({
    full_name: z
      .string()
      .min(3, "Enter your full name")
      .regex(/^[A-Za-z\s''-]+$/, "Name must contain letters only — no numbers or special characters"),
    student_number: z
      .string()
      .min(1, "Admission number is required")
      .regex(
        /^[A-Z]{1,4}\d{0,4}\/\d+\/\d{2,4}$/i,
        "Format: e.g. CT201/12345/23"
      ),
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    phone: z
      .string()
      .regex(/^\+?\d{10,15}$/, "Enter a valid phone number (e.g. +254712345678)")
      .optional()
      .or(z.literal("")),
    campus: z.enum(["Main Campus (Nchiru)", "Meru Town Campus"], { error: "Select your campus" }),
    school: z.string().min(1, "Select your school"),
    department: z.string().min(1, "Select your department"),
    programme: z.string().min(1, "Select your programme"),
    graduation_year: z.string().min(1, "Select graduation year"),
    employment_status: z.enum(
      [
        "Employed (Full-time)",
        "Employed (Part-time)",
        "Self-employed / Entrepreneur",
        "Internship / Attachment",
        "Further Studies",
        "Unemployed — Seeking",
        "Unemployed — Not Seeking",
      ],
      { error: "Select your employment status" }
    ),
    employer_name: z.string().optional(),
    job_title: z.string().optional(),
    sector: z.string().optional(),
    employment_county: z.string().optional(),
    months_to_employ: z.string().optional(),
    linkedin_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
    skills: z.array(z.string()).max(10, "Select up to 10 skills").optional(),
    consent: z.literal(true, { message: "You must consent to continue" }),
  })
  .refine((d) => d.email || d.phone, {
    message: "Provide at least an email or phone number",
    path: ["email"],
  })
  .refine(
    (d) => {
      const employed = d.employment_status &&
        !["Unemployed — Seeking", "Unemployed — Not Seeking", "Further Studies"].includes(d.employment_status);
      return !employed || !!d.employer_name?.trim();
    },
    { message: "Employer name is required when employed", path: ["employer_name"] },
  )
  .refine(
    (d) => {
      const employed = d.employment_status &&
        !["Unemployed — Seeking", "Unemployed — Not Seeking", "Further Studies"].includes(d.employment_status);
      return !employed || !!d.sector?.trim();
    },
    { message: "Sector is required when employed", path: ["sector"] },
  );

type FormData = z.infer<typeof schema>;

const STEPS = ["Personal Info", "Academic Details", "Employment"];

/* ── Field wrapper ──────────────────────────────────── */
function Field({
  label, required, error, children, hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="ml-1 text-amber-500">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

/* ── Styled native select ───────────────────────────── */
function NativeSelect({
  value, onChange, children, placeholder, hasError, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        hasError ? "border-destructive" : "border-input",
      )}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
}

/* ── Main form component ────────────────────────────── */
export function GraduateForm({ schools }: { schools: School[] }) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // Cascading data state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingProgs, setLoadingProgs] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      student_number: "",
      email: "",
      phone: "",
      campus: undefined,
      school: "",
      department: "",
      programme: "",
      graduation_year: "",
      employment_status: undefined,
      employer_name: "",
      job_title: "",
      sector: "",
      employment_county: "",
      months_to_employ: "",
      linkedin_url: "",
      skills: [],
      consent: undefined as unknown as true,
    },
    mode: "onChange",
  });

  const watchedSchool = watch("school");
  const watchedDept = watch("department");
  const watchedEmpStatus = watch("employment_status");

  // Fetch departments when school changes
  useEffect(() => {
    setValue("department", "");
    setValue("programme", "");
    setDepartments([]);
    setProgrammes([]);

    if (!watchedSchool) return;

    setLoadingDepts(true);
    fetchDepartments(watchedSchool)
      .then(setDepartments)
      .catch(() => setDepartments([]))
      .finally(() => setLoadingDepts(false));
  }, [watchedSchool, setValue]);

  // Fetch programmes when department changes
  useEffect(() => {
    setValue("programme", "");
    setProgrammes([]);

    if (!watchedSchool || !watchedDept) return;

    setLoadingProgs(true);
    fetchProgrammes(watchedSchool, watchedDept)
      .then(setProgrammes)
      .catch(() => setProgrammes([]))
      .finally(() => setLoadingProgs(false));
  }, [watchedDept, watchedSchool, setValue]);

  const isEmployed =
    watchedEmpStatus &&
    !["Unemployed — Seeking", "Unemployed — Not Seeking", "Further Studies"].includes(watchedEmpStatus);

  const stepFields: (keyof FormData)[][] = [
    ["full_name", "student_number", "email", "phone"],
    ["campus", "school", "department", "programme", "graduation_year"],
    ["employment_status", "employer_name", "sector", "skills", "consent"],
  ];

  async function nextStep() {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => s + 1);
  }
  function prevStep() { setStep((s) => s - 1); }

  async function onSubmit(data: FormData) {
    setSubmitError(null);
    startTransition(async () => {
      const result: SubmitResult = await submitGraduate({
        full_name:         data.full_name,
        student_number:    data.student_number || undefined,
        email:             data.email || undefined,
        phone:             data.phone || undefined,
        campus:            data.campus,
        school:            data.school,
        department:        data.department,
        programme:         data.programme,
        graduation_year:   data.graduation_year,
        employment_status: data.employment_status,
        employer_name:     data.employer_name || undefined,
        job_title:         data.job_title || undefined,
        sector:            data.sector || undefined,
        employment_county: data.employment_county || undefined,
        months_to_employ:  data.months_to_employ || undefined,
        linkedin_url:      data.linkedin_url || undefined,
        skills:            data.skills && data.skills.length > 0 ? data.skills : undefined,
      });
      if (result.success) {
        setSubmittedId(result.id);
        setSubmitted(true);
      } else {
        setSubmitError(result.error);
      }
    });
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    for (let i = 0; i < stepFields.length; i++) {
      const valid = await trigger(stepFields[i]);
      if (!valid) { setStep(i); return; }
    }
    handleSubmit(
      onSubmit,
      (fieldErrors) => {
        const errorKeys = Object.keys(fieldErrors) as (keyof FormData)[];
        for (let i = 0; i < stepFields.length; i++) {
          if (stepFields[i].some((f) => errorKeys.includes(f))) { setStep(i); return; }
        }
      },
    )();
  }

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40 text-center py-16">
        <CardContent className="flex flex-col items-center gap-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-black text-green-800 dark:text-green-300">
            Thank you for submitting!
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Your information has been recorded. The MUST Career Services team
            will use your data to improve employability support for future graduates.
          </p>
          <Badge className="mt-2 bg-green-700 text-white px-4 py-1 text-sm">
            Submission ID: #{submittedId}
          </Badge>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSubmitted(false);
              setStep(0);
              setSubmitError(null);
              setSubmittedId(null);
              reset();
              setDepartments([]);
              setProgrammes([]);
            }}
          >
            Submit Another Response
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} noValidate>
      {/* Progress bar */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            Step {step + 1} of {STEPS.length} —{" "}
            <span className="text-amber-600 dark:text-amber-400">{STEPS[step]}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {Math.round(((step + 1) / STEPS.length) * 100)}% complete
          </p>
        </div>
        <Progress
          value={((step + 1) / STEPS.length) * 100}
          className="h-2 bg-muted [&>div]:bg-gradient-to-r [&>div]:from-green-600 [&>div]:to-amber-500"
        />
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn("h-1 flex-1 rounded-full transition-all", i <= step ? "bg-amber-500" : "bg-muted")}
            />
          ))}
        </div>
      </div>

      {/* ── STEP 1: Personal Information ── */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-sm font-black text-amber-700 dark:text-amber-400">1</span>
              Personal Information
            </CardTitle>
            <CardDescription>
              Provide your name and at least one contact method (email or phone).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="Full Name" required error={errors.full_name?.message}>
              <Input
                placeholder="e.g. Jane Wanjiru Muthoni"
                {...register("full_name")}
                className={errors.full_name ? "border-destructive" : ""}
              />
            </Field>

            <Field label="Admission Number" required error={errors.student_number?.message} hint="Your MUST admission number e.g. CT201/111945/23 — any case accepted">
              <Input
                placeholder="e.g. CT201/111945/23"
                {...register("student_number", {
                  setValueAs: (v: string) => v?.trim().toUpperCase() ?? "",
                })}
                className={errors.student_number ? "border-destructive" : ""}
              />
            </Field>

            <Field label="Email Address" error={errors.email?.message} hint="Optional if phone is provided">
              <Input
                type="email"
                placeholder="jane@example.com"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
            </Field>

            <Field label="Phone Number" error={errors.phone?.message} hint="Optional if email is provided (e.g. +254712345678)">
              <Input
                type="tel"
                placeholder="+254712345678"
                {...register("phone")}
                className={errors.phone ? "border-destructive" : ""}
              />
            </Field>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 2: Academic Details ── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-sm font-black text-amber-700 dark:text-amber-400">2</span>
              Academic Details
            </CardTitle>
            <CardDescription>
              Your academic information at Meru University of Science and Technology.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="Campus" required error={errors.campus?.message}>
              <Controller
                name="campus"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                    {(["Main Campus (Nchiru)", "Meru Town Campus"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => field.onChange(c)}
                        className={cn(
                          "flex flex-1 items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all text-left",
                          field.value === c
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 font-semibold text-amber-700 dark:text-amber-400 ring-1 ring-amber-500"
                            : "border-border hover:border-amber-300 hover:bg-muted/40",
                        )}
                      >
                        <span className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                          field.value === c
                            ? "border-amber-500 bg-amber-500"
                            : "border-muted-foreground/40",
                        )}>
                          {field.value === c && (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              />
            </Field>

            <Field label="School / Faculty" required error={errors.school?.message}>
              <Controller
                name="school"
                control={control}
                render={({ field }) => (
                  <NativeSelect
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="— Select your school —"
                    hasError={!!errors.school}
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </NativeSelect>
                )}
              />
            </Field>

            <Field label="Department" required error={errors.department?.message}>
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <NativeSelect
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder={
                      !watchedSchool
                        ? "— Select school first —"
                        : loadingDepts
                        ? "Loading departments…"
                        : "— Select department —"
                    }
                    hasError={!!errors.department}
                    disabled={!watchedSchool || loadingDepts}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </NativeSelect>
                )}
              />
            </Field>

            <Field label="Degree Programme" required error={errors.programme?.message}>
              <Controller
                name="programme"
                control={control}
                render={({ field }) => (
                  <NativeSelect
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder={
                      !watchedDept
                        ? "— Select department first —"
                        : loadingProgs
                        ? "Loading programmes…"
                        : "— Select programme —"
                    }
                    hasError={!!errors.programme}
                    disabled={!watchedDept || loadingProgs}
                  >
                    {programmes.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </NativeSelect>
                )}
              />
            </Field>

            <Field label="Year of Graduation" required error={errors.graduation_year?.message}>
              <Controller
                name="graduation_year"
                control={control}
                render={({ field }) => (
                  <NativeSelect
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="— Select year —"
                    hasError={!!errors.graduation_year}
                  >
                    {GRADUATION_YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </NativeSelect>
                )}
              />
            </Field>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 3: Employment ── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-sm font-black text-amber-700 dark:text-amber-400">3</span>
              Employment Information
            </CardTitle>
            <CardDescription>
              Tell us about your current employment situation after graduation.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Current Employment Status" required error={errors.employment_status?.message}>
                <Controller
                  name="employment_status"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {(
                        [
                          "Employed (Full-time)",
                          "Employed (Part-time)",
                          "Self-employed / Entrepreneur",
                          "Internship / Attachment",
                          "Further Studies",
                          "Unemployed — Seeking",
                          "Unemployed — Not Seeking",
                        ] as const
                      ).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => field.onChange(s)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-all text-left",
                            field.value === s
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 font-semibold text-amber-700 dark:text-amber-400 ring-1 ring-amber-500"
                              : "border-border hover:border-amber-300 hover:bg-muted/40",
                          )}
                        >
                          <span className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                            field.value === s
                              ? "border-amber-500 bg-amber-500"
                              : "border-muted-foreground/40",
                          )}>
                            {field.value === s && (
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </span>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </Field>
            </div>

            {isEmployed && (
              <>
                 <Field label="Employer / Organisation Name" required={!!isEmployed} error={errors.employer_name?.message}>
                  <Input placeholder="e.g. Safaricom PLC" {...register("employer_name")} />
                </Field>

                <Field label="Job Title / Position" error={errors.job_title?.message}>
                  <Input placeholder="e.g. Software Engineer" {...register("job_title")} />
                </Field>

                <Field label="Industry / Sector" required={!!isEmployed} error={errors.sector?.message}>
                  <Controller
                    name="sector"
                    control={control}
                    render={({ field }) => (
                      <NativeSelect value={field.value ?? ""} onChange={field.onChange} placeholder="— Select sector —">
                        {EMPLOYMENT_SECTORS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </NativeSelect>
                    )}
                  />
                </Field>

                <Field label="County / Country of Work" error={errors.employment_county?.message}>
                  <Controller
                    name="employment_county"
                    control={control}
                    render={({ field }) => (
                      <NativeSelect value={field.value ?? ""} onChange={field.onChange} placeholder="— Select location —">
                        <option value="Outside Kenya">Outside Kenya</option>
                        {KENYAN_COUNTIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </NativeSelect>
                    )}
                  />
                </Field>

                <Field label="Months to First Employment" error={errors.months_to_employ?.message} hint="How long after graduation did you get your first job?">
                  <Controller
                    name="months_to_employ"
                    control={control}
                    render={({ field }) => (
                      <NativeSelect value={field.value ?? ""} onChange={field.onChange} placeholder="— Select —">
                        {[
                          "Already employed (internship converted)",
                          "Less than 1 month",
                          "1 – 3 months",
                          "4 – 6 months",
                          "7 – 12 months",
                          "More than 12 months",
                          "Still seeking",
                        ].map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </NativeSelect>
                    )}
                  />
                </Field>

                <Field label="LinkedIn Profile URL" error={errors.linkedin_url?.message} hint="Optional — helps employers connect with you">
                  <Input type="url" placeholder="https://linkedin.com/in/yourname" {...register("linkedin_url")} />
                </Field>
              </>
            )}

            {/* Skills */}
            <div className="sm:col-span-2">
              <Controller
                name="skills"
                control={control}
                render={({ field }) => {
                  const selected = field.value ?? [];
                  function toggle(skill: string) {
                    field.onChange(
                      selected.includes(skill)
                        ? selected.filter((s) => s !== skill)
                        : selected.length < 10 ? [...selected, skill] : selected
                    );
                  }
                  return (
                    <Field
                      label="Key Skills Used in Your Work"
                      hint="Select up to 10 skills that are most relevant to your current role or studies"
                      error={errors.skills?.message}
                    >
                      <div className="flex flex-wrap gap-2 pt-1">
                        {GRADUATE_SKILLS.map((skill) => {
                          const active = selected.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => toggle(skill)}
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                                active
                                  ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500"
                                  : "border-border hover:border-amber-300 hover:bg-muted/40 text-muted-foreground",
                                !active && selected.length >= 10 && "opacity-40 cursor-not-allowed",
                              )}
                            >
                              {active && <span className="mr-1">✓</span>}{skill}
                            </button>
                          );
                        })}
                      </div>
                      {selected.length > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {selected.length}/10 selected
                        </p>
                      )}
                    </Field>
                  );
                }}
              />
            </div>

            {/* Consent */}
            <div
              className={cn(
                "sm:col-span-2 rounded-xl border p-4",
                errors.consent ? "border-destructive bg-destructive/5" : "border-border bg-muted/30",
              )}
            >
              <Controller
                name="consent"
                control={control}
                render={({ field }) => (
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={(v) => field.onChange(v ? true : undefined)}
                      className="mt-0.5"
                    />
                    <div className="text-sm leading-relaxed text-foreground">
                      <span className="font-semibold">I consent</span> to Meru University of
                      Science and Technology (MUST) collecting and using my personal and
                      employment data for graduate employability research, career services
                      improvement, and institutional accreditation reporting.
                    </div>
                  </label>
                )}
              />
              {errors.consent && (
                <p className="mt-2 text-xs font-medium text-destructive">{errors.consent.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit error */}
      {submitError && (
        <div className={cn(
          "mt-4 rounded-lg border p-4 text-sm",
          submitError.toLowerCase().includes("already registered")
            ? "border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
            : "border-destructive bg-destructive/10 text-destructive"
        )}>
          <p className="font-bold mb-1">
            {submitError.toLowerCase().includes("already registered")
              ? "⚠️ Already Registered"
              : "❌ Submission Failed"}
          </p>
          <p>{submitError}</p>
          {submitError.toLowerCase().includes("already registered") && (
            <p className="mt-2 text-xs opacity-80">
              If you need to update your employment details, please contact the MUST Career Services office.
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <Button type="button" variant="outline" onClick={prevStep} disabled={step === 0} className="gap-2">
          ← Back
        </Button>
        <div className="flex items-center gap-2">
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="gap-2 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white"
            >
              Next Step →
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold px-8"
            >
              {isPending ? "Submitting…" : "🎓 Submit My Details"}
            </Button>
          )}
        </div>
      </div>

      {/* Step dots */}
      <div className="mt-6 flex justify-center gap-2">
        {STEPS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => i < step && setStep(i)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === step ? "w-6 bg-amber-500" : i < step ? "w-2 bg-green-500 cursor-pointer" : "w-2 bg-muted",
            )}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>
    </form>
  );
}
