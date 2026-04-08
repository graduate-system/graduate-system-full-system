/** Meru University of Science and Technology — Academic Structure */

export type MustDepartment = {
  id: string;
  name: string;
  programmes: readonly string[];
};

export type MustSchool = {
  id: string;
  name: string;
  departments: readonly MustDepartment[];
};

export const KENYAN_COUNTIES = [
  "Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa",
  "Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi",
  "Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos",
  "Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Murang'a",
  "Nairobi","Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri",
  "Samburu","Siaya","Taita-Taveta","Tana River","Tharaka-Nithi","Trans Nzoia",
  "Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot",
] as const;

export const EMPLOYMENT_SECTORS = [
  "Information & Communication Technology (ICT)",
  "Agriculture & Agri-Tech",
  "Banking & Financial Services",
  "Education & Academia",
  "Engineering & Construction",
  "Government & Public Service",
  "Healthcare & Medical",
  "Hospitality & Tourism",
  "Manufacturing & Industry",
  "Media & Communications",
  "NGO & Development Sector",
  "Retail & Trade",
  "Research & Innovation",
  "Self-Employed / Entrepreneurship",
  "Transport & Logistics",
  "Other",
] as const;

// MUST opened as MECOTECH in 1983 — earliest possible graduation year
const MUST_FOUNDED_YEAR = 1983;
const CURRENT_YEAR = new Date().getFullYear();

// For graduate self-registration: full range from 1983 to current year
export const GRADUATION_YEARS = Array.from(
  { length: CURRENT_YEAR - MUST_FOUNDED_YEAR + 1 },
  (_, i) => String(CURRENT_YEAR - i)
);

// For committee reporting/filtering: same full range
export const REPORT_YEARS = GRADUATION_YEARS;

export const GRADUATE_SKILLS = [
  // Technical / Digital
  "Programming / Software Development",
  "Data Analysis & Statistics",
  "Database Management (SQL/NoSQL)",
  "Networking & IT Infrastructure",
  "Cybersecurity",
  "Cloud Computing (AWS/Azure/GCP)",
  "Machine Learning / AI",
  "Web Development",
  "Mobile App Development",
  "GIS & Remote Sensing",
  // Engineering & Science
  "AutoCAD / Engineering Design",
  "Laboratory & Research Skills",
  "Environmental Assessment",
  "Surveying & Geomatics",
  // Business & Management
  "Project Management",
  "Financial Analysis & Accounting",
  "Marketing & Digital Marketing",
  "Supply Chain & Logistics",
  "Entrepreneurship & Business Development",
  // Health & Social
  "Clinical / Patient Care",
  "Public Health & Epidemiology",
  "Community Development",
  // Agriculture
  "Crop Production & Agronomy",
  "Animal Husbandry & Veterinary",
  "Agricultural Extension",
  // Soft Skills
  "Communication & Presentation",
  "Leadership & Team Management",
  "Problem Solving & Critical Thinking",
  "Report Writing & Documentation",
  "Customer Service",
] as const;

export type GraduateSkill = (typeof GRADUATE_SKILLS)[number];
