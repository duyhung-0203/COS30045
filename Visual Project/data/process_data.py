import pandas as pd

# File paths
life_expectancy_file = 'original data/API_SP.DYN.LE00.IN_DS2_en_csv_v2_99.csv'
gdp_file = 'original data/API_NY.GDP.MKTP.CD_DS2_en_csv_v2_2.csv'
geo_file = 'LatLong.csv'

# Load data
life_expectancy_data = pd.read_csv(life_expectancy_file, skiprows=4)
gdp_data = pd.read_csv(gdp_file, skiprows=4)
geo_data = pd.read_csv(geo_file)

# Step 1: Filter relevant columns and rows for two years
years = ['2019', '2020']
life_expectancy = life_expectancy_data[['Country Name', 'Country Code'] + years].rename(
    columns={'Country Name': 'Country'})
gdp = gdp_data[['Country Name', 'Country Code'] + years].rename(
    columns={'Country Name': 'Country'})

# Remove rows with missing data for the selected years
life_expectancy = life_expectancy.dropna(subset=years)
gdp = gdp.dropna(subset=years)

# Step 2: Merge Life Expectancy and GDP data
merged_data = pd.merge(life_expectancy, gdp, on=['Country', 'Country Code'], how='inner', suffixes=('_LifeExp', '_GDP'))

# Step 3: Merge with geographical data
geo_data = geo_data[['Country', 'lat', 'long']]
final_data = pd.merge(merged_data, geo_data, on='Country', how='inner')

# Step 4: Convert GDP to billions for readability
for year in years:
    final_data[f'{year}_GDP'] = final_data[f'{year}_GDP'] / 1e9  # Convert to billions

# Rename columns for clarity
renamed_columns = {f'{year}_GDP': f'{year} GDP (Billion $)' for year in years}
renamed_columns.update({f'{year}_LifeExp': f'{year} Life Expectancy' for year in years})
final_data = final_data.rename(columns=renamed_columns)

# Step 5: Save final data to CSV and JSON
output_csv_multi_year = 'final_data_multi_year.csv'
output_json_multi_year = 'final_data_multi_year.json'

final_data.to_csv(output_csv_multi_year, index=False)
final_data.to_json(output_json_multi_year, orient='records')

print("Processed multi-year data saved to:")
print(f"- CSV: {output_csv_multi_year}")
print(f"- JSON: {output_json_multi_year}")

# Display a sample of the processed data
final_data.head()
