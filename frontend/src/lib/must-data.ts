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

export const GRADUATION_YEARS = Array.from(
  { length: 15 },
  (_, i) => String(new Date().getFullYear() - i)
);
