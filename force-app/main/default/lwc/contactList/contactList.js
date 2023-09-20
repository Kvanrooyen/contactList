import { LightningElement, wire, track } from 'lwc';
import getContactList from '@salesforce/apex/ContactController.getContactList';

const actions = [
    { label: 'Delete', name:'delete'}
];

const columns = [
    { label: 'First Name', fieldName: 'FirstName', sortable: true },
    { label: 'Last Name', fieldName: 'LastName', sortable: true },
    { label: 'Title', fieldName: 'Title', sortable: true },
    { label: 'Phone', fieldName: 'Phone', type: 'phone', sortable: true },
    { label: 'Email', fieldName: 'Email', type: 'email', sortable: true },
    {
        type: 'action',
        typeAttributes: { rowActions: actions },
    },
];

export default class ContactList extends LightningElement {

    error;
    columns=columns;
    firstPage=1;
    totalContactCount;

        //data is used to populate the html datatable
        @track data;
        //page starts at 1 and then it can change
        @track currentPage=1;
        //can change according to the number or records per page
        @track totalPages;
        //default page size
        @track pageSize=6;
        @track isFirstPage=true;
        @track isLastPage=false;

    @wire(getContactList)
    contacts({ error, data }) {
        if (data) {
            this.contacts = data;
            this.totalContactCount = data.length;
            this.data = data.map((contact) => {
            return { ...contact, dataItemId: contact.Id };
        });

            this.calculateTotalPages();
        } else if (error) {
            this.error = error;
        }
    }

    // Calculate total pages based on total contact count
    calculateTotalPages() {
        this.totalPages = Math.ceil(this.totalContactCount / this.pageSize);

        // Initialize the current page (e.g., to the first page)
        this.currentPage = 1;

        // Call the method to update the data based on the current page
        this.handleUpdate(this.currentPage);
    }

    // Update the data based on the current page
    handleUpdate(page) {
        this.firstContact = (page - 1) * this.pageSize;
        this.lastContact = page * this.pageSize;
        this.lastContact = this.lastContact > this.totalContactCount ? this.totalContactCount : this.lastContact;
        this.data = this.contacts.slice(this.firstContact, this.lastContact);
    }

    //*Event Handlers
    //*Pagination Buttons
    handlePrevious(){
        if(this.currentPage>=1){
            this.currentPage=this.currentPage-1;
            this.handleUpdate(this.currentPage);
            this.isLastPage=false
            this.isFirstPage=this.currentPage<=1?true:false;
        }
    }
    handleNext(){
        if(this.currentPage<=this.totalPages){
            this.currentPage=this.currentPage+1
            this.handleUpdate(this.currentPage)
            this.isFirstPage=false
            this.isLastPage=this.currentPage>=this.totalPages?true:false
        }
    }
    
    handleFirst(){
        if(this.currentPage!==this.firstPage){
            this.currentPage=this.firstPage
            this.handleUpdate(this.currentPage)
            this.isFirstPage=true
            this.isLastPage=false
        }
    }
    handleLast(){
        if(this.currentPage!==this.totalPages){
            this.currentPage=this.totalPages
            this.handleUpdate(this.currentPage)
            this.isLastPage=true
            this.isFirstPage=false
        }
    }

   // Change page size and update it
    handlePageSize(e) {
        const selectedValue = e.detail.value;
        
        // Ensure that selectedValue is a valid number
        if (!isNaN(selectedValue) && selectedValue > 0) {
            // Update the page size
            this.pageSize = parseInt(selectedValue, 10);

            // Recalculate total pages and update the data
            this.calculateTotalPages();
        }
    }

    defaultSortDirection = 'asc';
    sortDirection = 'asc';
    sortedBy;

    //Called on header click: 
    //!it will only filter the current page results, because changing pages will call the handleUpdate. Need to figure out a way to bypass
    handleSort(e) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        this.sortedBy = sortedBy;
        this.sortDirection = sortDirection;

        // Sort the data based on the selected field and sort direction
        this.data = this.sortData(this.data, sortedBy, sortDirection);
    }

    // Sort the data based on the selected field and sort direction
    sortData(data, sortedBy, sortDirection) {
        const reverse = sortDirection === 'asc' ? 1 : -1;
        const cloneData = [...data];
        cloneData.sort((a, b) => {
            const fieldA = a[sortedBy] || '';
            const fieldB = b[sortedBy] || '';
            return reverse * fieldA.localeCompare(fieldB);
        });
        return cloneData;
    }

    findRowIndexId(id){
        let ret=-1;
        this.data.some((row,index)=>{
            if(row.id===id){
                ret=index;
                return true;
            } return false;
        });
        return ret;
    }

    deleteRow(row){
        const { id } =row;
        const index=this.findRowIndexId(id);
        if(index!==-1){
            this.data=this.data.slice(0,index).concat(this.data.slice(index+1));         
        }
    }

    handleRowAction(e) {
    const actionName=e.detail.action.name;
        const row=e.detail.row;
        switch(actionName){
            case 'delete':
                this.deleteRow(row)
                break;
            }
        }
}