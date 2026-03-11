### **Project SD 2026 \- 30434**

###  **Introduction**

Think and implement a client-server application that has real life applications. Your application should have \~2-3 roles. Be creative, don’t come with a classic Student Manager App. For some examples, check the Examples section.  
The application can be developed in every framework/ language you are familiar with.

### **First iteration**

You are required to write the documentation in a PDF format of the project (in an initial phase). The structure should be:

1. Title page (student, project name, other useful info)  
2. Content  
3. Introduction \- write a short description (\~5-10 lines) explaining the reason of the project and what made you chose the project  
4. Diagrams:  
   1. database diagram \- it should have \~5 tables; please mark the relations (1 \- 1, 1 \- n, etc)  
   2. use-case diagram  
   3. for every user, an activity diagram

**Deadline: 18.03.2025 (-1p for every late week)**

### **Example 1**

Use Java/C\#/Python API to design and implement a client-server application for managing the consultations of doctors in a clinic. The application has three types of users: the clinic secretary, the doctors and an administrator.  
The clinic secretary can perform the following operations:

- add/update patients (patient information: name, identity card number, personal numerical code, date of birth, address).  
- CRUD on patients’ consultations (e.g. scheduling a consultation, assigning a doctor to a patient based on the doctor’s availability).

The doctors can perform the following operations:

- add/view the details of a patient’s (past) consultation.

The administrator can perform the following operations:

- CRUD on user accounts.

In addition, when a patient having a consultation has arrived at the clinic and checked in at the secretary desk, the application should inform the associated doctor by displaying a message.

### **Example 2**

Use JAVA/C\#/Python API to design and implement an application for the front desk employees of a bank. The application should have two types of users (a regular user represented by the front desk employee and an administrator user) which have to provide a username and a password in order to use the application.  
The regular user can perform the following operations:

- Add/update/view client information (name, identity card number, personal numerical code, address, etc.).  
- Create/update/delete/view client account (account information: identification number, type: current, savings, amount of money, date of creation).  
- Transfer money between accounts.  
- Process utilities bills.

The administrator user can perform the following operations:

- CRUD on employees’ information.  
- Generate reports for a particular period containing the activities performed by an employee.