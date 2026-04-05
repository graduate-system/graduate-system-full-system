/** Meru University of Science and Technology — Academic Structure */

export const MUST_SCHOOLS = [
  {
    id: "sci",
    name: "School of Computing and Informatics (SCI)",
    departments: [
      {
        id: "cs",
        name: "Department of Computer Science",
        programmes: [
          "Bachelor of Science (Computer Science)",
          "Bachelor of Science (Mathematics and Computer Science)",
          "Master of Science (Computer Science)",
          "Doctor of Philosophy (Computer Science)",
        ],
      },
      {
        id: "it",
        name: "Department of Information Technology",
        programmes: [
          "Bachelor of Science (Information Technology)",
          "Bachelor of Business Information Technology (BBIT)",
          "Bachelor of Science (Computer Technology)",
          "Bachelor of Science (Computer Security and Forensics)",
          "Master of Science (Information Technology)",
        ],
      },
    ],
  },
  {
    id: "sbe",
    name: "School of Business and Economics (SBE)",
    departments: [
      {
        id: "bus",
        name: "Department of Business Administration",
        programmes: [
          "Bachelor of Business Administration (BBA)",
          "Bachelor of Commerce (B.Com)",
          "Bachelor of Co-operative Management",
          "Master of Business Administration (MBA)",
          "Doctor of Philosophy (Business Management)",
        ],
      },
      {
        id: "fin",
        name: "Department of Finance and Accounting",
        programmes: [
          "Bachelor of Science (Actuarial Science)",
          "Bachelor of Purchasing and Supplies Management",
          "Bachelor of Science (Finance)",
          "Certified Public Accountant (CPA)",
        ],
      },
      {
        id: "econ",
        name: "Department of Economics and Statistics",
        programmes: [
          "Bachelor of Science (Statistics)",
          "Bachelor of Science (Economics)",
          "Bachelor of Science (Applied Statistics)",
        ],
      },
    ],
  },
  {
    id: "sea",
    name: "School of Engineering and Architecture (SEA)",
    departments: [
      {
        id: "civil",
        name: "Department of Civil and Structural Engineering",
        programmes: [
          "Bachelor of Science (Civil Engineering)",
          "Bachelor of Science (Structural Engineering)",
          "Master of Science (Civil Engineering)",
        ],
      },
      {
        id: "elec",
        name: "Department of Electrical and Electronics Engineering",
        programmes: [
          "Bachelor of Science (Electrical and Electronics Engineering)",
          "Bachelor of Science (Telecommunication Engineering)",
          "Master of Science (Electrical Engineering)",
        ],
      },
      {
        id: "mech",
        name: "Department of Mechanical Engineering",
        programmes: [
          "Bachelor of Science (Mechanical Engineering)",
          "Bachelor of Science (Manufacturing Engineering)",
        ],
      },
    ],
  },
  {
    id: "safs",
    name: "School of Agriculture and Food Science (SAFS)",
    departments: [
      {
        id: "agri",
        name: "Department of Agriculture",
        programmes: [
          "Bachelor of Science (Horticulture)",
          "Bachelor of Science (Crop Protection)",
          "Bachelor of Science (Animal Production)",
          "Master of Science (Agriculture)",
          "Doctor of Philosophy (Agriculture Science)",
        ],
      },
      {
        id: "food",
        name: "Department of Food Science and Technology",
        programmes: [
          "Bachelor of Science (Food Science and Technology)",
          "Bachelor of Science (Food Science and Nutrition)",
          "Bachelor of Science (Food Nutrition and Dietetics)",
          "Master of Science (Food Science and Technology)",
          "Doctor of Philosophy (Food Science)",
        ],
      },
    ],
  },
  {
    id: "shs",
    name: "School of Health Sciences (SHS)",
    departments: [
      {
        id: "pub_health",
        name: "Department of Public Health",
        programmes: [
          "Bachelor of Science (Public Health)",
          "Bachelor of Science (Community Health and Development)",
          "Bachelor of Science (Environmental Health)",
          "Master of Science (Public Health)",
          "Doctor of Philosophy (Public Health)",
        ],
      },
      {
        id: "med_lab",
        name: "Department of Medical Laboratory Science",
        programmes: [
          "Bachelor of Science (Medical Laboratory Science)",
          "Diploma in Medical Laboratory Science",
        ],
      },
    ],
  },
  {
    id: "sn",
    name: "School of Nursing (SN)",
    departments: [
      {
        id: "nursing",
        name: "Department of Nursing Sciences",
        programmes: [
          "Bachelor of Science (Nursing)",
          "Diploma in Kenya Registered Nursing",
          "Master of Science (Nursing)",
        ],
      },
    ],
  },
  {
    id: "se",
    name: "School of Education (SE)",
    departments: [
      {
        id: "ed_sci",
        name: "Department of Education (Science)",
        programmes: [
          "Bachelor of Education (Science) — B.Ed (Sc)",
          "Postgraduate Diploma in Education (PGDE)",
          "Master of Education (Science)",
        ],
      },
      {
        id: "ed_arts",
        name: "Department of Education (Arts)",
        programmes: [
          "Bachelor of Education (Arts) — B.Ed (Arts)",
          "Master of Education (Arts)",
        ],
      },
    ],
  },
  {
    id: "spas",
    name: "School of Pure and Applied Sciences (SPAS)",
    departments: [
      {
        id: "math",
        name: "Department of Mathematics",
        programmes: [
          "Bachelor of Science (Mathematics)",
          "Bachelor of Science (Applied Mathematics)",
          "Master of Science (Mathematics)",
        ],
      },
      {
        id: "chem",
        name: "Department of Chemistry",
        programmes: [
          "Bachelor of Science (Chemistry)",
          "Bachelor of Science (Industrial Chemistry with Management)",
          "Master of Science (Chemistry)",
        ],
      },
      {
        id: "phys",
        name: "Department of Physics",
        programmes: [
          "Bachelor of Science (Physics)",
          "Bachelor of Science (Applied Physics)",
        ],
      },
      {
        id: "bio",
        name: "Department of Biological Sciences",
        programmes: [
          "Bachelor of Science (Biological Sciences)",
          "Bachelor of Science (Microbiology)",
          "Master of Science (Biological Sciences)",
        ],
      },
    ],
  },
] as const;

export type MustSchool = (typeof MUST_SCHOOLS)[number];

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
