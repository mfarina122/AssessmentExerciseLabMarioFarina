import { useEffect, useState } from "react";
import { Container, Typography } from "@mui/material";
import { DataTable, Column } from "../components/DataTable"; // Aggiusta il percorso in base alla tua struttura

interface department {
  code: string;
  description: string;
}

interface EmployeeListQuery {
  address: string;
  code: string;
  department: department | null;
  email: string;
  firstName: string;
  id: number,
  lastName: string,
  phone: string,
}
interface Filter {
  columnId: string;
  value: string;
}

export default function EmployeeListPage() {
  const [filteredList, setFilteredList] = useState<EmployeeListQuery[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);

  const columns: Column<EmployeeListQuery>[] = [
    {
      id: 'firstName',
      label: 'First Name',
      width: 120,
      renderCell: (employee) => employee.firstName,
      filterable: true,
      getValue: (employee) => employee.firstName
    },
    {
      id: 'lastName',
      label: 'Last Name',
      width: 120,
      renderCell: (employee) => employee.lastName,
      filterable: true,
      getValue: (employee) => employee.lastName
    },
    {
      id: 'code',
      label: 'Code',
      width: 100,
      renderCell: (employee) => employee.code,
      filterable: false,
      getValue: (employee) => employee.code
    },
    {
      id: 'department',
      label: 'Department',
      width: 150,
      renderCell: (employee) => employee.department ? employee.department.description : '-',
      filterable: false,
      getValue: (employee) => employee.department ? employee.department.description : ''
    },
    {
      id: 'address',
      label: 'Address',
      width: 200,
      renderCell: (employee) => employee.address,
      filterable: false,
      getValue: (employee) => employee.address
    },
    {
      id: 'email',
      label: 'Email',
      width: 200,
      renderCell: (employee) => employee.email,
      filterable: false,
      getValue: (employee) => employee.email
    },
    {
      id: 'phone',
      label: 'Phone',
      width: 120,
      renderCell: (employee) => employee.phone,
      filterable: false,
      getValue: (employee) => employee.phone
    }
  ];

  // Fetch iniziale
  useEffect(() => {
    setLoading(true);
    fetch("/api/employees/list")
      .then((response) => response.json())
      .then((data: EmployeeListQuery[]) => {
        setFilteredList(data); // iniziale = tutti
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching employees:", error);
        alert("Attenzione, errore nel recupero dati!");
        setLoading(false);
      });
  }, []);

  // Logica di filtro esterno
  useEffect(() => {
    const queryParams = filters
    .filter((f) => f.value.trim() !== '')
    .map((f) => `${encodeURIComponent(f.columnId)}=${encodeURIComponent(f.value)}`)
    .join('&');
  setLoading(true);
  const url = queryParams ? `/api/employees/list?${queryParams}` : `/api/employees/list`;
  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error('Errore nella risposta');
      return response.json();
    })
    .then((data: EmployeeListQuery[]) => {
      setFilteredList(data);
      setLoading(false);
    })
    .catch((error) => {
        console.error("Errore durante il filtraggio:", error);
        setLoading(false);
    });
  }, [filters]);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ p: 2, textAlign: 'center' }}>
        Employee
      </Typography>
        <DataTable
          filteredData={filteredList} // Usiamo i dati filtrati
          columns={columns}
          keyExtractor={(employee) => employee.id}
          onFilterChange={setFilters} // Comunica i filtri in uscita
          isLoading={loading}
        />
    </Container>
  );
}