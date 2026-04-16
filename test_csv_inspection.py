import pandas as pd

df = pd.read_csv('dataset/synthetic_users/freelancer_01.csv')
print("Columns:", df.columns.tolist())
print("\nFirst 5 rows:")
print(df.head())
print("\nCredit column unique values (first 10):")
print(df['credit'].head(10).tolist())
print("\nDebit column unique values (first 10):")
print(df['debit'].head(10).tolist())
print("\nCredit non-null count:", df['credit'].notna().sum())
print("Credit sum:", pd.to_numeric(df['credit'], errors='coerce').sum())
print("Debit sum:", pd.to_numeric(df['debit'], errors='coerce').sum())
