using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Backend.Infrastructure.Database;

namespace Backend.Features.Customers;

//Classe che implementa un IRequest, il quale mi restituirà la lista di risposta della query, utilizzando i due elementi della classe come filtri.
public class CustomersListQuery : IRequest<List<CustomersListQueryResponse>>
{
    public string? Name { get; set; }
    public string? Email { get; set; }
}

//Questo è il JSON che verrà restituito al frontend, pronto per essere consumato
public class CustomersListQueryResponse
{
    public int Id { get; set; }
    public string Name { get; internal set; } = "";
    public string Address { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Iban { get; set; } = "";
    public CustomersListQueryResponseCategory? CustomerCategory { get; set; }
}
//Classe della categoria (sostituirà quello che faceva praticamente department nella parte degli employee)
public class CustomersListQueryResponseCategory
{
    public string Code { get; set; } = "";
    public string Description { get; set; } = "";
}

internal class CustomersListQueryHandler : IRequestHandler<CustomersListQuery, List<CustomersListQueryResponse>>
{
    private readonly BackendContext context;

    public CustomersListQueryHandler(BackendContext context)
    {
        this.context = context;
    }

    public async Task<List<CustomersListQueryResponse>> Handle(CustomersListQuery request, CancellationToken cancellationToken)
    {
        //Qui, Include fa in modo che nella query venga inserito anche la tabella CustomerCategory
        var query = context.Customers
            .Include(c => c.CustomerCategory)
            .AsQueryable();
        //Qui c'è l'equivalente di una SELECT * FROM Customer WHERE LOWER(NAME) LIKE '%request.Name.ToLower()%', facendo in modo che sia case insensitive
        if (!string.IsNullOrEmpty(request.Name))
            query = query.Where(q => q.Name.ToLower().Contains(request.Name.ToLower()));
        
        if (!string.IsNullOrEmpty(request.Email))
            query = query.Where(q => q.Email.ToLower().Contains(request.Email.ToLower()));
        //Ordino il risultato per Name
        var data = await query
            .OrderBy(q => q.Name)
            .ToListAsync(cancellationToken);
        //Costruisco l'oggetto che verrà restituito con tutti gli elementi
        var result = new List<CustomersListQueryResponse>();
        
        foreach (var item in data)
        {
            var resultItem = new CustomersListQueryResponse
            {
                Id = item.Id,
                Name = item.Name,
                Address = item.Address,
                Email = item.Email,
                Phone = item.Phone,
                Iban = item.Iban
            };
            
            if (item.CustomerCategory is not null)
            {
                resultItem.CustomerCategory = new CustomersListQueryResponseCategory
                {
                    Code = item.CustomerCategory.Code,
                    Description = item.CustomerCategory.Description
                };
            }
            
            result.Add(resultItem);
        }
        
        return result;
    }
}