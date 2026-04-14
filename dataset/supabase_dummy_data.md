# DigiLocker Minimal Dataset

Only one table is used here.

## Run Steps

1. Open Supabase SQL Editor.
2. Paste the SQL below.
3. Run it.

## SQL

```sql
create extension if not exists "pgcrypto";

create table if not exists public.digilocker_users (
  id uuid primary key default gen_random_uuid(),
  user_name text not null,
  dob date not null,
  pan text not null unique,
  aadhaar text not null unique,
  address text not null,
  created_at timestamptz not null default now()
);

insert into public.digilocker_users (user_name, dob, pan, aadhaar, address)
values
  ('Aarohi Deshmukh', date '1992-03-15', 'ABCDE1234F', 'XXXX-XXXX-1001', '42 MG Road, Pune, Maharashtra 411001'),
  ('Rohan Kulkarni', date '1989-07-22', 'BCDEF2345G', 'XXXX-XXXX-1002', '18 FC Road, Pune, Maharashtra 411004'),
  ('Sneha Patil', date '1994-11-08', 'CDEFG3456H', 'XXXX-XXXX-1003', '12 Shivaji Nagar, Pune, Maharashtra 411005'),
  ('Omkar Jadhav', date '1990-01-19', 'DEFGH4567I', 'XXXX-XXXX-1004', '55 Dadar West, Mumbai, Maharashtra 400028'),
  ('Tejaswini Joshi', date '1993-05-27', 'EFGHI5678J', 'XXXX-XXXX-1005', '22 Andheri East, Mumbai, Maharashtra 400069'),
  ('Saurabh Shinde', date '1988-09-13', 'FGHIJ6789K', 'XXXX-XXXX-1006', '9 Bandra West, Mumbai, Maharashtra 400050'),
  ('Gauri Chavan', date '1995-02-04', 'GHIJK7890L', 'XXXX-XXXX-1007', '31 Kothrud, Pune, Maharashtra 411038'),
  ('Nikhil Pawar', date '1991-12-16', 'HIJKL8901M', 'XXXX-XXXX-1008', '77 Aundh, Pune, Maharashtra 411007'),
  ('Vaishnavi More', date '1996-08-29', 'IJKLM9012N', 'XXXX-XXXX-1009', '14 Sadar, Nagpur, Maharashtra 440001'),
  ('Aditya Bhosale', date '1990-04-10', 'JKLMN0123O', 'XXXX-XXXX-1010', '88 Dharampeth, Nagpur, Maharashtra 440010'),
  ('Pooja Kale', date '1993-10-01', 'KLMNO1234P', 'XXXX-XXXX-1011', '21 Civil Lines, Nagpur, Maharashtra 440001'),
  ('Prathamesh Sawant', date '1987-06-21', 'LMNOP2345Q', 'XXXX-XXXX-1012', '6 Mahal, Nagpur, Maharashtra 440032'),
  ('Isha Wagh', date '1998-01-05', 'MNOPQ3456R', 'XXXX-XXXX-1013', '13 Nashik Road, Nashik, Maharashtra 422101'),
  ('Shubham Gokhale', date '1992-12-30', 'NOPQR4567S', 'XXXX-XXXX-1014', '44 Panchavati, Nashik, Maharashtra 422003'),
  ('Neha Khot', date '1994-03-18', 'OPQRS5678T', 'XXXX-XXXX-1015', '25 College Road, Nashik, Maharashtra 422005'),
  ('Akshay Salunkhe', date '1989-08-11', 'PQRST6789U', 'XXXX-XXXX-1016', '5 Satpur, Nashik, Maharashtra 422007'),
  ('Mansi Dhavale', date '1997-04-24', 'QRSTU7890V', 'XXXX-XXXX-1017', '19 Tarabai Park, Kolhapur, Maharashtra 416003'),
  ('Rahul Mane', date '1991-11-02', 'RSTUV8901W', 'XXXX-XXXX-1018', '66 Rajarampuri, Kolhapur, Maharashtra 416008'),
  ('Ketaki Karande', date '1995-09-09', 'STUVW9012X', 'XXXX-XXXX-1019', '9 Shivaji Peth, Kolhapur, Maharashtra 416012'),
  ('Swapnil Dongre', date '1988-02-14', 'TUVWX0123Y', 'XXXX-XXXX-1020', '101 Laxmipuri, Kolhapur, Maharashtra 416002'),
  ('Anuja Gaikwad', date '1992-07-07', 'UVWXY1234Z', 'XXXX-XXXX-1021', '15 Civil Lines, Aurangabad, Maharashtra 431001'),
  ('Vivek Mhatre', date '1990-10-19', 'VWXYZ2345A', 'XXXX-XXXX-1022', '27 CIDCO, Aurangabad, Maharashtra 431003'),
  ('Rutuja Kadam', date '1996-05-30', 'WXYZA3456B', 'XXXX-XXXX-1023', '40 Osmanpura, Chhatrapati Sambhajinagar, Maharashtra 431005'),
  ('Siddharth Bhise', date '1987-12-12', 'XYZAB4567C', 'XXXX-XXXX-1024', '8 Jalna Road, Chhatrapati Sambhajinagar, Maharashtra 431001'),
  ('Mrunal Inamdar', date '1993-06-03', 'YZABC5678D', 'XXXX-XXXX-1025', '32 Wardha Road, Nagpur, Maharashtra 440015'),
  ('Amol Dighe', date '1989-01-26', 'ZABCD6789E', 'XXXX-XXXX-1026', '11 Hingna Road, Nagpur, Maharashtra 440016'),
  ('Shruti Karmarkar', date '1997-10-15', 'ABCDE7890F', 'XXXX-XXXX-1027', '54 Kalyan West, Thane, Maharashtra 421301'),
  ('Harshal Tambe', date '1991-03-12', 'BCDEF8901G', 'XXXX-XXXX-1028', '23 Thane West, Thane, Maharashtra 400601'),
  ('Tanvi Pingle', date '1994-12-05', 'CDEFG9012H', 'XXXX-XXXX-1029', '16 Vashi, Navi Mumbai, Maharashtra 400703'),
  ('Yash Potdar', date '1988-09-22', 'DEFGH0123I', 'XXXX-XXXX-1030', '7 Nerul, Navi Mumbai, Maharashtra 400706'),
  ('Prajakta Nene', date '1992-02-09', 'EFGHI1234J', 'XXXX-XXXX-1031', '28 Borivali East, Mumbai, Maharashtra 400066'),
  ('Aniket Ranade', date '1995-07-17', 'FGHIJ2345K', 'XXXX-XXXX-1032', '91 Mulund West, Mumbai, Maharashtra 400080'),
  ('Pritam Bhondve', date '1990-11-28', 'GHIJK3456L', 'XXXX-XXXX-1033', '18 Chembur, Mumbai, Maharashtra 400071'),
  ('Sonali Raut', date '1996-04-14', 'HIJKL4567M', 'XXXX-XXXX-1034', '12 Kurla West, Mumbai, Maharashtra 400070'),
  ('Chinmay Apte', date '1989-05-06', 'IJKLM5678N', 'XXXX-XXXX-1035', '39 Ghatkopar East, Mumbai, Maharashtra 400077'),
  ('Rucha Damle', date '1993-08-23', 'JKLMN6789O', 'XXXX-XXXX-1036', '4 Shivajinagar, Pune, Maharashtra 411005'),
  ('Prasad Lele', date '1987-01-31', 'KLMNO7890P', 'XXXX-XXXX-1037', '60 Katraj, Pune, Maharashtra 411046'),
  ('Komal Bendre', date '1998-06-18', 'LMNOP8901Q', 'XXXX-XXXX-1038', '33 Hadapsar, Pune, Maharashtra 411028'),
  ('Sanket Vaidya', date '1991-09-27', 'MNOPQ9012R', 'XXXX-XXXX-1039', '70 Sinhagad Road, Pune, Maharashtra 411030'),
  ('Mayuri Sathe', date '1994-10-08', 'NOPQR0123S', 'XXXX-XXXX-1040', '15 Akurdi, Pimpri-Chinchwad, Maharashtra 411035'),
  ('Ashutosh Paranjape', date '1988-03-20', 'OPQRS1234T', 'XXXX-XXXX-1041', '44 Chinchwad, Pimpri-Chinchwad, Maharashtra 411019'),
  ('Revati Limaye', date '1995-02-28', 'PQRST2345U', 'XXXX-XXXX-1042', '9 Bhandup West, Mumbai, Maharashtra 400078'),
  ('Hemant Khare', date '1990-07-11', 'QRSTU3456V', 'XXXX-XXXX-1043', '22 Powai, Mumbai, Maharashtra 400076'),
  ('Namrata Sane', date '1993-11-19', 'RSTUV4567W', 'XXXX-XXXX-1044', '11 Malad West, Mumbai, Maharashtra 400064'),
  ('Kunal Bapat', date '1989-04-25', 'STUVW5678X', 'XXXX-XXXX-1045', '29 Panvel, Raigad, Maharashtra 410206'),
  ('Bhagyashree Nerkar', date '1997-01-13', 'TUVWX6789Y', 'XXXX-XXXX-1046', '8 Alibag, Raigad, Maharashtra 402201'),
  ('Nilesh Pansare', date '1991-05-29', 'UVWXY7890Z', 'XXXX-XXXX-1047', '17 Satara Road, Satara, Maharashtra 415001'),
  ('Dipali Jagtap', date '1994-09-03', 'VWXYZ8901A', 'XXXX-XXXX-1048', '24 Karad, Satara, Maharashtra 415110'),
  ('Shreyas Nerlekar', date '1988-12-07', 'WXYZA9012B', 'XXXX-XXXX-1049', '62 Solapur Road, Solapur, Maharashtra 413001'),
  ('Aditi Rane', date '1996-02-16', 'XYZAB0123C', 'XXXX-XXXX-1050', '10 Miraj, Sangli, Maharashtra 416410')
on conflict (pan) do update set
  user_name = excluded.user_name,
  dob = excluded.dob,
  aadhaar = excluded.aadhaar,
  address = excluded.address;

-- Quick check
-- select * from public.digilocker_users order by created_at desc;
```
