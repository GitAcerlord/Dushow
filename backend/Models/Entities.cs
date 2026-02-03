using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Dushow.Backend.Models
{
    public enum ProfileType { Professional, Client, Admin }
    public enum ContractStatus { Pending, Accepted, Paid, Completed, Disputed }

    public class User
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string AsaasCustomerId { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
        
        public Profile Profile { get; set; }
        public ICollection<Contract> ContractsAsClient { get; set; }
        public ICollection<Contract> ContractsAsProfessional { get; set; }
    }

    public class Profile
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public ProfileType Type { get; set; }
        public string Bio { get; set; }
        public decimal Rating { get; set; }
        public int Points { get; set; }
        public bool IsVerified { get; set; }
        public bool IsSuperstar { get; set; }
        public decimal? HourlyRate { get; set; }
    }

    public class Contract
    {
        public Guid Id { get; set; }
        public Guid EventId { get; set; }
        public Guid ProfessionalId { get; set; }
        public Guid ClientId { get; set; }
        public decimal Amount { get; set; }
        public decimal PlatformFee { get; set; }
        public ContractStatus Status { get; set; }
        public string AsaasPaymentId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}