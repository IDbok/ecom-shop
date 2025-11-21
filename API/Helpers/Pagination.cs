namespace API.Helpers;

public class Pagination<T>(int pageIndex, int pageSize, int count, IReadOnlyList<T> data)
{
    /// <summary>
    /// Текущий номер страницы (начинается с 1)
    /// </summary>
    public int PageIndex { get; set; } = pageIndex;
    
    /// <summary>
    /// Размер страницы (количество элементов на странице)
    /// </summary>
    public int PageSize { get; set; } = pageSize;
    
    /// <summary>
    /// Общее количество элементов
    /// </summary>
    public int Count { get; set; } = count;
    
    /// <summary>
    /// Данные текущей страницы
    /// </summary>
    public IReadOnlyList<T> Data { get; set; } = data;
    
    /// <summary>
    /// Общее количество страниц
    /// </summary>
    public int TotalPages => (int)Math.Ceiling((double)Count / PageSize);
    
    /// <summary>
    /// Есть ли предыдущая страница
    /// </summary>
    public bool HasPrevious => PageIndex > 1;
    
    /// <summary>
    /// Есть ли следующая страница
    /// </summary>
    public bool HasNext => PageIndex < TotalPages;
    
    /// <summary>
    /// Номер первого элемента на текущей странице
    /// </summary>
    public int FirstItemIndex => Count == 0 ? 0 : (PageIndex - 1) * PageSize + 1;
    
    /// <summary>
    /// Номер последнего элемента на текущей странице
    /// </summary>
    public int LastItemIndex => Math.Min(PageIndex * PageSize, Count);
}
