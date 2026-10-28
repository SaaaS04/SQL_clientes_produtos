with open("PROJETO/ETL_project.sql") as open_file:
    query = open_file.read()
    
print(query)

print(query.format(date='2025-01-01'))