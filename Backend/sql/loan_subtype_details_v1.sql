CREATE TABLE education_loan_details (
    id SERIAL PRIMARY KEY,
    loan_application_id INT UNIQUE REFERENCES loan_applications(id) ON DELETE CASCADE,

    course_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    college_name VARCHAR(150) NOT NULL,
    university_name VARCHAR(150),
    admission_status VARCHAR(50),
    entrance_exam VARCHAR(50),
    entrance_score VARCHAR(50),

    course_duration INT,
    year_of_study INT,

    -- Dynamic academic percentage list, e.g.:
    -- [{"level":"10th"|"ssc"|"12th"|"B.Tech"|"M.Sc", "percentage": 78.5}]
    academic_percentages JSONB NOT NULL DEFAULT '[]'::jsonb,

    tuition_fee DECIMAL(12,2),
    hostel_fee DECIMAL(12,2),
    other_expenses DECIMAL(12,2)
);

CREATE TABLE gold_loan_details (
    id SERIAL PRIMARY KEY,
    loan_application_id INT UNIQUE REFERENCES loan_applications(id) ON DELETE CASCADE,

    gold_type VARCHAR(50) NOT NULL,
    total_weight_grams DECIMAL(10,2) NOT NULL,
    purity_karat VARCHAR(10),
    item_count INT,

    valuation_per_gram DECIMAL(10,2),
    total_valuation DECIMAL(12,2),

    ltv_ratio DECIMAL(5,2),
    approved_loan_amount DECIMAL(12,2)
);

CREATE TABLE home_loan_details (
    id SERIAL PRIMARY KEY,
    loan_application_id INT UNIQUE REFERENCES loan_applications(id) ON DELETE CASCADE,

    property_type VARCHAR(50),
    property_status VARCHAR(50),
    property_location TEXT,

    builder_name VARCHAR(100),
    property_value DECIMAL(12,2),

    down_payment DECIMAL(12,2),
    loan_to_value DECIMAL(5,2),

    purpose VARCHAR(100)
);